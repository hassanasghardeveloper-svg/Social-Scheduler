import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConnectInstagramButton from '@/components/ConnectInstagramButton'
import ConnectedAccounts from '@/components/ConnectedAccounts'
import DashboardLayout from '@/components/DashboardLayout'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default async function SettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const error = params.error as string
    const success = params.success as string
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user's workspaces
    let { data: workspaces } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

    // Create a workspace if none exists
    let currentWorkspace = workspaces?.[0]
    if (!currentWorkspace) {
        const { data: newWorkspace } = await supabase
            .from('workspaces')
            .insert({
                name: 'Default Workspace',
                owner_id: user.id
            })
            .select()
            .single()
        currentWorkspace = newWorkspace
    }

    // Get connected social accounts
    const { data: socialAccounts } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', currentWorkspace?.id || '')
        .eq('is_active', true)

    return (
        <DashboardLayout currentPage="settings">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
                    Settings
                </h1>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 flex items-center gap-3 text-red-800 dark:text-red-200">
                        <AlertCircle size={20} />
                        <p className="text-sm font-medium">
                            {error === 'no_pages' && 'No Facebook Pages found. You need a Facebook Page to connect Instagram.'}
                            {error === 'no_instagram' && 'No Instagram Professional account linked to this Facebook Page.'}
                            {error === 'oauth_denied' && 'Connection cancelled or denied.'}
                            {error === 'connection_failed' && 'Failed to connect. Please try again.'}
                            {!['no_pages', 'no_instagram', 'oauth_denied', 'connection_failed'].includes(error) && 'An unexpected error occurred.'}
                        </p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 flex items-center gap-3 text-green-800 dark:text-green-200">
                        <CheckCircle2 size={20} />
                        <p className="text-sm font-medium">
                            Account connected successfully!
                        </p>
                    </div>
                )}

                {/* Workspace Info */}
                <section className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Workspace
                    </h2>
                    <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Name:</span> {currentWorkspace?.name || 'Default Workspace'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Owner:</span> {user.email}
                        </p>
                    </div>
                </section>

                {/* Connected Accounts */}
                <section className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                                Connected Accounts
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Connect your Instagram account to start posting
                            </p>
                        </div>
                        <div className="self-start sm:self-auto">
                            <ConnectInstagramButton workspaceId={currentWorkspace?.id || 'default'} />
                        </div>
                    </div>

                    {socialAccounts && socialAccounts.length > 0 ? (
                        <ConnectedAccounts accounts={socialAccounts} />
                    ) : (
                        <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                            <div className="text-4xl mb-4">📱</div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No accounts connected yet
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Click "Connect Instagram" above to get started
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    )
}
