import { useEffect, useRef, useState, useCallback } from 'react'
import { Calendar, ChevronLeft, Info, MessageSquare, Search, Send } from 'lucide-react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import toast from 'react-hot-toast'
import { Avatar, EmptyState, Spinner } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch'
import { messagingApi } from '@/services/api'
import { getStoredAuthSession } from '@/services/authStorage'
import { cn } from '@/utils'
import type { ConversationResponse, MessageResponse } from '@/types'

export function MessagesPage() {
  const { user, hasRole } = useAuthStore()
  const isProvider = hasRole('PROVIDER')
  const isClient = hasRole('CLIENT')
  const isEnabled = isProvider || isClient

  const {
    items: conversations,
    setItems: setConversations,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePaginatedFetch<ConversationResponse>(
    (page, size) => messagingApi.getMyConversations(page, size),
    {
      pageSize: 20,
      getItemKey: (conversation) => conversation.id,
      enabled: isEnabled,
    },
  )

  const [activeConv, setActiveConv] = useState<ConversationResponse | null>(null)
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const stompClientRef = useRef<Client | null>(null)

  // Memoize refresh for websocket
  const stableRefresh = useCallback(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!user || !isEnabled) return
    const session = getStoredAuthSession()

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : {},
      onConnect: () => {
        client.subscribe('/user/queue/messages', (payload) => {
          const newMessage: MessageResponse = JSON.parse(payload.body)

          setMessages((prev) => {
            if (prev.some((message) => message.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })

          setConversations((prev) => {
            const exists = prev.some(c => c.id === newMessage.conversationId)
            if (!exists) {
              stableRefresh()
            }
            return prev.map((conversation) =>
              conversation.id === newMessage.conversationId
                ? {
                    ...conversation,
                    lastMessageContent: newMessage.content,
                    createdAt: newMessage.createdAt,
                    unreadCount: activeConv?.id === conversation.id ? 0 : conversation.unreadCount + 1,
                  }
                : conversation
            )
          })
        })
      },
      onStompError: (frame) => {
        console.error('Stomp error', frame)
      },
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [user, isEnabled, activeConv?.id, stableRefresh, setConversations])

  useEffect(() => {
    if (!activeConv) return

    messagingApi.getMessages(activeConv.id)
      .then((response) => setMessages(response.content))
      .catch(() => toast.error("Erreur lors du chargement des messages"))

    messagingApi.markAsRead(activeConv.id).catch(() => undefined)
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeConv.id ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    )

    if (window.innerWidth < 1024) {
      setShowSidebar(false)
    }
  }, [activeConv, setConversations])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!text.trim() || !activeConv) return

    setSending(true)
    try {
      const message = await messagingApi.sendMessage(activeConv.id, text.trim())
      setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message])
      setText('')

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeConv.id
            ? {
                ...conversation,
                lastMessageContent: text.trim(),
                createdAt: new Date().toISOString(),
              }
            : conversation,
        ),
      )
    } catch {
      toast.error("Échec de l'envoi")
    } finally {
      setSending(false)
    }
  }

  async function handleLoadMoreConversations() {
    try {
      await loadMore()
    } catch {
      toast.error("Impossible de charger plus de conversations")
    }
  }

  const filtered = conversations.filter((conversation) => {
    if (!search) return true
    const query = search.toLowerCase()
    return (
      conversation.clientFullName.toLowerCase().includes(query) ||
      (conversation.providerDisplayName ?? '').toLowerCase().includes(query)
    )
  })

  const getContactName = (conversation: ConversationResponse) =>
    hasRole('CLIENT') ? (conversation.providerDisplayName ?? 'Prestataire') : conversation.clientFullName

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="text-muted text-sm mt-1">Discutez avec vos {hasRole('CLIENT') ? 'prestataires' : 'clients'}</p>
        </div>
      </div>

      {!isEnabled ? (
        <EmptyState
          icon={<MessageSquare size={28} />}
          title="Accès non autorisé"
          description="Les administrateurs n'ont pas de messagerie personnelle."
        />
      ) : (
        <div className="card p-0 overflow-hidden flex flex-1 bg-surface shadow-xl shadow-black/5 border-gray-100">
          <div className={cn(
            "w-full lg:w-80 shrink-0 border-r border-border flex flex-col transition-all",
            !showSidebar && "hidden lg:flex",
          )}>
            <div className="p-4 border-b border-border bg-soft/30">
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
                className="bg-white"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-20"><Spinner /></div>
              ) : error ? (
                <EmptyState
                  icon={<MessageSquare size={24} />}
                  title="Chargement impossible"
                  description="Les conversations n'ont pas pu être récupérées."
                  className="py-10"
                />
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare size={24} />}
                  title="Aucun message"
                  description="Vos discussions apparaîtront ici."
                  className="py-10"
                />
              ) : (
                <>
                  {filtered.map((conversation) => {
                    const isActive = activeConv?.id === conversation.id
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => setActiveConv(conversation)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-4 text-left transition-all border-b border-border/40 relative',
                          isActive ? 'bg-primary/5' : 'hover:bg-soft/50',
                        )}
                      >
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                        <div className="relative shrink-0">
                          <Avatar name={getContactName(conversation)} size="lg" className="rounded-2xl" />
                          {conversation.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center ring-2 ring-surface">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className={cn(
                              'text-sm truncate font-bold',
                              conversation.unreadCount > 0 ? 'text-text' : 'text-text/80',
                            )}>
                              {getContactName(conversation)}
                            </p>
                            <span className="text-[10px] text-muted whitespace-nowrap ml-2">
                              {new Date(conversation.createdAt).toLocaleDateString('fr-FR', { weekday: 'short' })}
                            </span>
                          </div>
                          <p className="text-xs text-muted truncate">
                            {conversation.lastMessageContent || "Démarrer la discussion..."}
                          </p>
                        </div>
                      </button>
                    )
                  })}

                  {hasMore && (
                    <div className="p-4 border-t border-border/40">
                      <Button
                        variant="outline"
                        fullWidth
                        loading={loadingMore}
                        onClick={handleLoadMoreConversations}
                        aria-label="Charger plus de conversations"
                      >
                        Charger plus
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={cn(
            "flex-1 flex flex-col bg-white transition-all",
            showSidebar && "hidden lg:flex",
          )}>
            {!activeConv ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F9FAFB]/50">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4 animate-bounce-slow">
                  <MessageSquare size={40} />
                </div>
                <h3 className="text-lg font-display font-bold text-text">Vos messages</h3>
                <p className="text-muted max-w-xs mt-2">
                  Sélectionnez une personne dans la liste pour commencer à échanger en temps réel.
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="lg:hidden p-2 -ml-2 text-muted hover:bg-soft rounded-xl transition-colors"
                      aria-label="Revenir à la liste des conversations"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <Avatar name={getContactName(activeConv)} size="md" className="rounded-xl" />
                    <div>
                      <p className="font-bold text-text text-sm leading-none mb-1">{getContactName(activeConv)}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <p className="text-[10px] text-muted font-medium uppercase tracking-wider">En ligne</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-2 text-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                      aria-label="Afficher les informations de la conversation"
                    >
                      <Info size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#F9FAFB]/30 custom-scrollbar">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                      <Calendar size={32} className="mb-2" />
                      <p className="text-xs font-medium uppercase tracking-widest">Début de la conversation</p>
                    </div>
                  )}

                  {messages.map((message, index) => {
                    const isMine = message.senderUserId === user?.email
                    const previousMessage = messages[index - 1]
                    const isSameSender = previousMessage?.senderUserId === message.senderUserId

                    return (
                      <div key={message.id} className={cn('flex flex-col', isMine ? 'items-end' : 'items-start', isSameSender ? 'mt-1' : 'mt-4')}>
                        <div className={cn(
                          'max-w-[75%] lg:max-w-md px-4 py-3 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md',
                          isMine
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-white border border-gray-100 text-text rounded-tl-none',
                        )}>
                          {message.content}
                        </div>
                        {!isSameSender && (
                          <p className={cn(
                            'text-[10px] mt-1.5 font-bold uppercase tracking-tighter opacity-50',
                            isMine ? 'text-right' : '',
                          )}>
                            {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="px-6 py-5 border-t border-border bg-white">
                  <div className="flex items-center gap-3 bg-[#F3F4F6] p-1.5 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <input
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Tapez votre message ici..."
                      className="bg-transparent border-none focus:ring-0 text-sm flex-1 px-3 py-2 text-text placeholder:text-muted/60 outline-none"
                    />
                    <Button
                      onClick={sendMessage}
                      loading={sending}
                      disabled={!text.trim()}
                      className="rounded-xl h-10 w-10 !p-0 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30"
                      aria-label="Envoyer le message"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
