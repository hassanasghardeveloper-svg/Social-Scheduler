import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.redirect(new URL('/settings?error=oauth_denied', request.url))
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL('/settings?error=invalid_request', request.url))
    }

    try {
        const { workspaceId, platform } = JSON.parse(atob(state))
        const targetPlatform = platform || 'instagram' // Default to instagram for backward compatibility

        // Exchange code for access_token
        const redirectUri = `${request.nextUrl.origin}/api/auth/callback/meta`

        const tokenResponse = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.META_APP_ID,
                client_secret: process.env.META_APP_SECRET,
                redirect_uri: redirectUri,
                code,
            }),
        })

        const tokenData = await tokenResponse.json()

        if (!tokenData.access_token) {
            throw new Error('No access token received')
        }

        // Exchange short-lived token for long-lived token
        const longLivedResponse = await fetch(
            `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
        )

        const longLivedData = await longLivedResponse.json()
        const accessToken = longLivedData.access_token || tokenData.access_token

        // Get user's Facebook Pages
        const accountsResponse = await fetch(
            `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
        )

        const accountsData = await accountsResponse.json()

        if (!accountsData.data || accountsData.data.length === 0) {
            return NextResponse.redirect(new URL('/settings?error=no_pages', request.url))
        }

        // Get the first page's details
        const page = accountsData.data[0]
        const pageId = page.id
        const pageAccessToken = page.access_token
        const pageName = page.name

        const supabase = await createClient()

        if (targetPlatform === 'facebook') {
            // Connect Facebook Page directly
            // Get page profile picture
            const pageDetailsResponse = await fetch(
                `https://graph.facebook.com/v21.0/${pageId}?fields=picture&access_token=${pageAccessToken}`
            )
            const pageDetails = await pageDetailsResponse.json()
            const profilePictureUrl = pageDetails.picture?.data?.url || null

            // Store the Facebook Page account
            const { error: dbError } = await supabase.from('social_accounts').upsert({
                workspace_id: workspaceId,
                platform: 'facebook',
                account_id: pageId,
                account_name: pageName,
                profile_picture_url: profilePictureUrl,
                access_token: pageAccessToken, // Store encrypted in production
                token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
                is_active: true,
            }, {
                onConflict: 'workspace_id,account_id'
            })

            if (dbError) throw dbError

            return NextResponse.redirect(new URL('/settings?success=connected', request.url))
        } else {
            // Connect Instagram account (original logic)
            const igResponse = await fetch(
                `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
            )

            const igData = await igResponse.json()

            if (!igData.instagram_business_account) {
                return NextResponse.redirect(new URL('/settings?error=no_instagram', request.url))
            }

            const igBusinessId = igData.instagram_business_account.id

            // Get Instagram account details
            const igDetailsResponse = await fetch(
                `https://graph.facebook.com/v21.0/${igBusinessId}?fields=username,profile_picture_url&access_token=${pageAccessToken}`
            )

            const igDetails = await igDetailsResponse.json()

            // Store the account
            const { error: dbError } = await supabase.from('social_accounts').upsert({
                workspace_id: workspaceId,
                platform: 'instagram',
                account_id: igBusinessId,
                account_name: igDetails.username,
                profile_picture_url: igDetails.profile_picture_url,
                access_token: pageAccessToken, // Store encrypted in production
                token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
                is_active: true,
            }, {
                onConflict: 'workspace_id,account_id'
            })

            if (dbError) throw dbError

            return NextResponse.redirect(new URL('/settings?success=connected', request.url))
        }
    } catch (error) {
        console.error('OAuth callback error:', error)
        return NextResponse.redirect(new URL('/settings?error=connection_failed', request.url))
    }
}
