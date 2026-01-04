import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Copy, CheckCircle2 } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  mediaId: string
  mediaTitle: string
  sharedWith?: string[]
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  mediaId,
  mediaTitle,
  sharedWith = [],
}) => {
  const [copied, setCopied] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'link' | 'users'>('link')

  if (!isOpen) return null

  const shareUrl = `${window.location.origin}/gallery?mediaId=${mediaId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Share Media</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Media Title */}
          <div>
            <p className="text-sm text-slate-400 mb-1">Sharing:</p>
            <p className="text-white font-medium truncate">{mediaTitle}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-700">
            <button
              onClick={() => setSelectedTab('link')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                selectedTab === 'link'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Share Link
            </button>
            <button
              onClick={() => setSelectedTab('users')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                selectedTab === 'users'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Shared With ({sharedWith.length})
            </button>
          </div>

          {/* Link Share Tab */}
          {selectedTab === 'link' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                Copy the link below to share this media
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-white shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Users Share Tab */}
          {selectedTab === 'users' && (
            <div className="space-y-3">
              {sharedWith.length > 0 ? (
                <div className="space-y-2">
                  {sharedWith.map((userId) => (
                    <div
                      key={userId}
                      className="p-2 bg-slate-700/50 rounded-lg flex items-center justify-between"
                    >
                      <span className="text-sm text-white">{userId}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">
                  Not shared with any users yet
                </p>
              )}
              <p className="text-xs text-slate-500 text-center">
                Share via link to allow others to access
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-end">
          <Button onClick={onClose} variant="outline" className="gap-2">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
