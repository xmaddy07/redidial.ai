import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { onSocket, offSocket } from '../services'
import { showLocalNotification } from '../services/pushNotifications'
import {
  getTeamChatUnreadTotal,
  onTeamChatUnreadChanged,
  emitTeamChatIncoming,
} from '../utils/teamChatNotify'
import { registerIncomingTeamMessage } from '../screens/main/teamMessages/utils'

function showTeamMessageNotification(senderName, preview, { conversationId, senderId }) {
  showLocalNotification({
    title: senderName || 'Team Messages',
    message: preview || 'New message',
    data: {
      type: 'TEAM_CHAT',
      conversationId: String(conversationId),
      senderId: senderId != null ? String(senderId) : '',
      senderName: senderName || '',
    },
  })
}

export function useTeamChatGlobalNotify() {
  const currentUser = useSelector((state) => state.auth.user)
  const currentUserId = currentUser?.id ?? currentUser?.user_id

  useEffect(() => {
    const handleNotify = (data) => {
      const result = registerIncomingTeamMessage(data, currentUserId)
      if (!result) return

      emitTeamChatIncoming(result)

      if (!result.shouldNotify) return

      const senderName =
        data?.sender?.name ||
        data?.peer?.name ||
        [data?.sender?.first_name, data?.sender?.last_name].filter(Boolean).join(' ') ||
        ''
      const preview = String(result.incoming.content || '').slice(0, 120)
      showTeamMessageNotification(senderName, preview, {
        conversationId: result.conversationId,
        senderId: result.incoming.senderId,
      })
    }

    onSocket('internalChatNotify', handleNotify)
    return () => offSocket('internalChatNotify', handleNotify)
  }, [currentUserId])
}

export function useTeamChatTabBadge(setUnreadTotal) {
  useEffect(() => {
    setUnreadTotal(getTeamChatUnreadTotal())
    return onTeamChatUnreadChanged(setUnreadTotal)
  }, [setUnreadTotal])
}
