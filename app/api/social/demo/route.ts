import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API Route to create a simulation/demo Instagram account
 * This allows testing the platform without a real Meta App setup
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { workspaceId } = await request.json()

        if (!workspaceId) {
            return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })
        }

        // Verify ownership
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('id', workspaceId)
            .eq('owner_id', user.id)
            .single()

        if (!workspace) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

        // Create Demo Account
        const demoId = `demo_${Math.random().toString(36).substring(7)}`
        const { data: account, error: accountError } = await supabase
            .from('social_accounts')
            .insert({
                workspace_id: workspaceId,
                platform: 'instagram',
                account_name: 'Demo Account (Simulator)',
                account_id: demoId,
                access_token: 'demo_token_simulator',
                profile_picture_url: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=100&h=100&fit=crop',
                is_active: true
            })
            .select()
            .single()

        if (accountError) throw accountError

        return NextResponse.json({ success: true, account })
    } catch (error: any) {
        console.error('Demo account creation error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
