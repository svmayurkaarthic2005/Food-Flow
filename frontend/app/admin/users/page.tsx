'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, MoreVertical, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fetchUsers } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetchUsers(roleFilter === 'all' ? undefined : roleFilter)
        setUsers(response.data)
      } catch (error) {
        console.error('Failed to load users:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [roleFilter])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DONOR':
        return 'bg-primary/10 text-primary'
      case 'NGO':
        return 'bg-success/10 text-success'
      case 'ADMIN':
        return 'bg-logistics/10 text-logistics'
      default:
        return 'bg-secondary text-foreground'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const totalUsers = users.length
  const donors = users.filter(u => u.role === 'DONOR').length
  const ngos = users.filter(u => u.role === 'NGO').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage platform users and permissions</p>
        </div>
        <Button asChild className="gap-2">
          <a href="#"><Plus className="w-4 h-4" />Add User</a>
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="DONOR">Donor</SelectItem>
                <SelectItem value="NGO">NGO</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{filteredUsers.length} users found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">Joined</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">Activity</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      {user.role === 'NGO' ? (
                        <span className="text-sm font-medium text-foreground">{user.activity.toFixed(0)} kg claimed</span>
                      ) : (
                        <span className="text-sm font-medium text-foreground">{user.activity} donations</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>View Activity</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-3xl font-bold text-foreground mt-2">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Donors</p>
            <p className="text-3xl font-bold text-primary mt-2">{donors}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">NGOs</p>
            <p className="text-3xl font-bold text-logistics mt-2">{ngos}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="text-3xl font-bold text-success mt-2">{users.filter(u => u.role === 'ADMIN').length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
