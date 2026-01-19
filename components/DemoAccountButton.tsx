'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'

export default function DemoAccountButton({ workspaceId }: { workspaceId: string }) {
    const [loading, setLoading] = useState(false)

    const handleCreateDemo = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/social/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceId }),
            })

            if (response.ok) {
                window.location.reload()
            } else {
                const data = await response.json()
                alert(data.error || 'Failed to create demo account')
            }
        } catch (error) {
            alert('Error creating demo account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleCreateDemo}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium border border-gray-300 dark:border-gray-700 disabled:opacity-50"
        >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Add Demo Account
        </button>
    )
}
