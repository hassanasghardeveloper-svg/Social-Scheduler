'use client'

import { Facebook } from 'lucide-react'

export default function ConnectFacebookButton({ workspaceId }: { workspaceId: string }) {
    const handleConnect = () => {
        const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID
        const redirectUri = `${window.location.origin}/api/auth/callback/meta`

        const scope = [
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
            'pages_read_user_content'
        ].join(',')

        // Include platform type in state for callback to differentiate
        const state = btoa(JSON.stringify({ workspaceId, platform: 'facebook' }))

        const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`

        window.location.href = authUrl
    }

    return (
        <button
            onClick={handleConnect}
            className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-all font-medium"
        >
            <Facebook size={20} />
            Connect Facebook
        </button>
    )
}
