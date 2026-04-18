import getRedisClient from '@/lib/redis'
import { Redis } from 'ioredis'

// Event channels
export const EventChannels = {
  NEW_DONATION: 'foodflow:new-donation',
  CLAIM_CREATED: 'foodflow:claim-created',
  CLAIM_COMPLETED: 'foodflow:claim-completed',
  NGO_NOTIFICATION: 'foodflow:ngo-notification',
  DONOR_NOTIFICATION: 'foodflow:donor-notification',
}

// Event types
export interface DonationEvent {
  type: 'NEW_DONATION'
  listingId: string
  donorId: string
  name: string
  quantity: string
  category: string
  expiryTime: string
  latitude: number
  longitude: number
}

export interface ClaimEvent {
  type: 'CLAIM_CREATED' | 'CLAIM_COMPLETED'
  claimId: string
  listingId: string
  ngoId: string
  donorId: string
  status: string
}

export interface NotificationEvent {
  type: 'NGO_NOTIFICATION' | 'DONOR_NOTIFICATION'
  userId: string
  title: string
  message: string
  data?: any
}

export type FoodFlowEvent = DonationEvent | ClaimEvent | NotificationEvent

/**
 * Publish event to Redis channel
 */
export async function publishEvent(
  channel: string,
  event: FoodFlowEvent
): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const payload = JSON.stringify(event)
    await redis.publish(channel, payload)
    console.log(`📢 Published event to ${channel}:`, event.type)
    return true
  } catch (error) {
    console.error('Event publish error:', error)
    return false
  }
}

/**
 * Subscribe to Redis channel
 */
export function subscribeToChannel(
  channel: string,
  callback: (event: FoodFlowEvent) => void
): Redis {
  const subscriber = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  })

  subscriber.subscribe(channel, (err: Error | null) => {
    if (err) {
      console.error(`Failed to subscribe to ${channel}:`, err)
    } else {
      console.log(`✅ Subscribed to ${channel}`)
    }
  })

  subscriber.on('message', (ch: string, message: string) => {
    if (ch === channel) {
      try {
        const event = JSON.parse(message) as FoodFlowEvent
        callback(event)
      } catch (error) {
        console.error('Event parse error:', error)
      }
    }
  })

  return subscriber
}

/**
 * Unsubscribe from channel
 */
export async function unsubscribeFromChannel(
  subscriber: Redis,
  channel: string
): Promise<void> {
  await subscriber.unsubscribe(channel)
  await subscriber.quit()
  console.log(`Unsubscribed from ${channel}`)
}

/**
 * Publish new donation event
 */
export async function publishNewDonation(listing: any): Promise<void> {
  const event: DonationEvent = {
    type: 'NEW_DONATION',
    listingId: listing.id,
    donorId: listing.donorId,
    name: listing.name,
    quantity: listing.quantity,
    category: listing.category,
    expiryTime: listing.expiryTime,
    latitude: listing.latitude,
    longitude: listing.longitude,
  }
  
  await publishEvent(EventChannels.NEW_DONATION, event)
}

/**
 * Publish claim event
 */
export async function publishClaimEvent(
  type: 'CLAIM_CREATED' | 'CLAIM_COMPLETED',
  claim: any
): Promise<void> {
  const event: ClaimEvent = {
    type,
    claimId: claim.id,
    listingId: claim.listingId,
    ngoId: claim.ngoId,
    donorId: claim.listing?.donorId,
    status: claim.status,
  }
  
  const channel = type === 'CLAIM_CREATED' 
    ? EventChannels.CLAIM_CREATED 
    : EventChannels.CLAIM_COMPLETED
    
  await publishEvent(channel, event)
}

/**
 * Publish notification
 */
export async function publishNotification(
  userId: string,
  title: string,
  message: string,
  isNGO: boolean = false,
  data?: any
): Promise<void> {
  const event: NotificationEvent = {
    type: isNGO ? 'NGO_NOTIFICATION' : 'DONOR_NOTIFICATION',
    userId,
    title,
    message,
    data,
  }
  
  const channel = isNGO 
    ? EventChannels.NGO_NOTIFICATION 
    : EventChannels.DONOR_NOTIFICATION
    
  await publishEvent(channel, event)
}
