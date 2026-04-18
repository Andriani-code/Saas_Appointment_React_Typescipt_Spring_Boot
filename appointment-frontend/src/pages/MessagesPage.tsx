import { useState, useEffect, useRef } from 'react'
import { Send, Search, MessageSquare } from 'lucide-react'
import { messagingApi } from '@/services/api'
import { Avatar, Spinner, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, cn } from '@/utils'
import type { ConversationResponse, MessageResponse } from '@/types'

export function MessagesPage() {
  const { user, hasRole } = useAuth()

  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [activeConv,    setActiveConv]    = useState<ConversationResponse | null>(null)
  const [messages,      setMessages]      = useState<MessageResponse[]>([])
  const [text,          setText]          = useState('')
  const [loading,       setLoading]       = useState(true)
  const [sending,       setSending]       = useState(false)
  const [search,        setSearch]        = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagingApi.getMyConversations()
      .then(d => setConversations(d.content))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeConv) return
    messagingApi.getMessages(activeConv.id)
      .then(d => setMessages(d.content))
    messagingApi.markAsRead(activeConv.id)
    setConversations(prev =>
      prev.map(c => c.id === activeConv.id ? { ...c, unreadCount: 0 } : c)
    )
  }, [activeConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!text.trim() || !activeConv) return
    setSending(true)
    try {
      const msg = await messagingApi.sendMessage(activeConv.id, text.trim())
      setMessages(prev => [...prev, msg])
      setText('')
    } catch { /* no-op */ }
    finally { setSending(false) }
  }

  const filtered = conversations.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.clientFullName.toLowerCase().includes(q) ||
      (c.specialistDisplayName ?? '').toLowerCase().includes(q)
  })

  const getContactName = (c: ConversationResponse) =>
    hasRole('CLIENT') ? (c.specialistDisplayName ?? 'Spécialiste') : c.clientFullName

  return (
    <div className="animate-fade-in">
      <h1 className="page-title mb-6">Messages</h1>

      <div className="card p-0 overflow-hidden flex" style={{ height: '70vh' }}>
        {/* Conversations list */}
        <div className="w-72 shrink-0 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <Input
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10"><Spinner /></div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted px-4">Aucune conversation</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveConv(c)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-border/50',
                    activeConv?.id === c.id ? 'bg-primary/8' : 'hover:bg-soft'
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar name={getContactName(c)} size="md" />
                    {c.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm truncate',
                      c.unreadCount > 0 ? 'font-semibold text-text' : 'font-medium text-text'
                    )}>
                      {getContactName(c)}
                    </p>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {formatDate(c.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<MessageSquare size={28} />}
                title="Sélectionnez une conversation"
                description="Choisissez une conversation dans la liste pour commencer."
              />
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-4 border-b border-border flex items-center gap-3 bg-soft/50">
                <Avatar name={getContactName(activeConv)} size="md" />
                <div>
                  <p className="font-semibold text-text text-sm">{getContactName(activeConv)}</p>
                  {activeConv.reservationId && (
                    <p className="text-xs text-muted">Lié à un rendez-vous</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.map(msg => {
                  const isMine = msg.senderUserId === user?.email
                  return (
                    <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                        isMine
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-soft text-text rounded-bl-sm'
                      )}>
                        {msg.content}
                        <p className={cn(
                          'text-[10px] mt-1',
                          isMine ? 'text-white/60 text-right' : 'text-muted'
                        )}>
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Écrire un message…"
                    className="input-base flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    loading={sending}
                    disabled={!text.trim()}
                    icon={<Send size={15} />}
                    className="shrink-0"
                  >
                    Envoyer
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
