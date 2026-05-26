"use client"

import { authClient } from "@/lib/auth-client"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type User = { name?: string; email: string; id: string; [key: string]: unknown }

export default function DevicePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userCode = searchParams.get("user_code") || ""
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const formattedCode = userCode.replace(/-/g, "").toUpperCase()

  useEffect(() => {
    const loadSession = async () => {
      const result = await authClient.getSession()
      if (result.data?.user) {
        setUser(result.data.user)
      }
      setLoading(false)
    }
    loadSession()
  }, [])

  const verifyCode = async () => {
    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/device?user_code=${formattedCode}`)}`)
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await authClient.device({
        query: { user_code: formattedCode },
      })

      if (response.data) {
        setStatus(response.data.status)
      }
    } catch {
      setError("Invalid or expired code")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleApprove = async () => {
    await authClient.device.approve({ userCode: formattedCode })
    setStatus("approved")
  }

  const handleDeny = async () => {
    await authClient.device.deny({ userCode: formattedCode })
    setStatus("denied")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Device Authorization</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!userCode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Device Authorization</CardTitle>
            <CardDescription>No user code provided</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Device Authorization</CardTitle>
            <CardDescription>Please log in to authorize this device</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/login?callbackUrl=${encodeURIComponent(`/device?user_code=${formattedCode}`)}`}>
                Log in
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Device Authorization</CardTitle>
            <CardDescription>Code: {formattedCode}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              Logged in as {user.name || user.email}
            </p>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={verifyCode} disabled={isVerifying} className="w-full">
              {isVerifying ? "Verifying..." : "Continue"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (status === "approved") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Device Authorized</CardTitle>
            <CardDescription>You can return to the CLI application</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (status === "denied") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Authorization Denied</CardTitle>
            <CardDescription>You denied access for this device</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Device Authorization</CardTitle>
          <CardDescription>Code: {formattedCode}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            A device is requesting access to your account.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleApprove} className="w-full">
            Approve
          </Button>
          <Button variant="outline" onClick={handleDeny} className="w-full">
            Deny
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}