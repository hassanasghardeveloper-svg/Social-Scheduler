import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CalendarView from '@/components/CalendarView'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

export default async function CalendarPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user's workspace
    let { data: workspaces } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

    let workspace = workspaces?.[0]

    // Create workspace if none exists
    if (!workspace) {
        const { data: newWorkspace } = await supabase
            .from('workspaces')
            .insert({
                name: 'Default Workspace',
                owner_id: user.id
            })
            .select()
            .single()
        workspace = newWorkspace
    }

    if (!workspace) {
        redirect('/dashboard')
    }

    // Get posts for this workspace
    const { data: posts } = await supabase
        .from('posts')
        .select('*, social_accounts(*), media_assets(*)')
        .eq('workspace_id', workspace.id)
        .gte('scheduled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('scheduled_at', { ascending: true })

    return (
        <DashboardLayout currentPage="calendar">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        Calendar
                    </h1>
                    <Link
                        href="/composer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                    >
                        Create Post
                    </Link>
                </div>

                <CalendarView posts={posts || []} />
            </div>
        </DashboardLayout>
    )
}
