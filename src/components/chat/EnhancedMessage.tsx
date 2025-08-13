import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Stethoscope,
  Calendar,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface MessageUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
  sender: MessageUser;
  messageType?: string;
}

interface Props {
  message: Message;
  isOwnMessage: boolean;
  colorScheme?: 'blue' | 'green' | 'red';
  onReferenceClick?: (type: string, id: string) => void;
}

const colors = {
  blue: {
    own: 'bg-blue-600 text-white',
    ownTime: 'text-blue-100',
    other: 'bg-gray-100 text-gray-900',
    otherTime: 'text-gray-500',
    reference: 'bg-blue-50 border-blue-200 text-blue-800',
    accent: 'text-blue-600'
  },
  green: {
    own: 'bg-green-600 text-white',
    ownTime: 'text-green-100',
    other: 'bg-gray-100 text-gray-900',
    otherTime: 'text-gray-500',
    reference: 'bg-green-50 border-green-200 text-green-800',
    accent: 'text-green-600'
  },
  red: {
    own: 'bg-red-600 text-white',
    ownTime: 'text-red-100',
    other: 'bg-gray-100 text-gray-900',
    otherTime: 'text-gray-500',
    reference: 'bg-red-50 border-red-200 text-red-800',
    accent: 'text-red-600'
  }
};

export const EnhancedMessage: React.FC<Props> = ({
  message,
  isOwnMessage,
  colorScheme = 'blue',
  onReferenceClick
}) => {
  const currentColors = colors[colorScheme];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 1 week
      return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getReferenceIcon = (type: string) => {
    switch (type) {
      case 'patient': return <User className="h-3 w-3" />;
      case 'device': return <Stethoscope className="h-3 w-3" />;
      case 'appointment': return <Calendar className="h-3 w-3" />;
      case 'rental': return <Building2 className="h-3 w-3" />;
      case 'user': return <Users className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const parseMessageContent = (content: string) => {
    const referenceRegex = /@(patient|device|appointment|rental|user):(.*?)(?=\s|$)/g;
    const parts: Array<{ type: 'text' | 'reference'; content: string; refType?: string; refTitle?: string }> = [];
    let lastIndex = 0;

    let match;
    while ((match = referenceRegex.exec(content)) !== null) {
      // Add text before the reference
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }

      // Add the reference
      parts.push({
        type: 'reference',
        content: match[0],
        refType: match[1],
        refTitle: match[2]
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
  };

  const contentParts = parseMessageContent(message.content);

  return (
    <div className={cn("flex mb-4", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn("flex items-start space-x-2 max-w-xs lg:max-w-md", isOwnMessage && "flex-row-reverse space-x-reverse")}>
        {!isOwnMessage && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
              {getInitials(message.sender.firstName, message.sender.lastName)}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={cn("flex flex-col", isOwnMessage ? "items-end" : "items-start")}>
          {!isOwnMessage && (
            <div className="text-xs text-gray-600 mb-1">
              {message.sender.firstName} {message.sender.lastName}
              <Badge variant="outline" className="ml-2 text-xs">
                {message.sender.role}
              </Badge>
            </div>
          )}

          <div className={cn(
            "px-4 py-3 rounded-lg shadow-sm",
            isOwnMessage ? currentColors.own : currentColors.other
          )}>
            <div className="space-y-1">
              {contentParts.map((part, index) => {
                if (part.type === 'reference') {
                  return (
                    <button
                      key={index}
                      onClick={() => onReferenceClick?.(part.refType!, part.refTitle!)}
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border transition-colors hover:shadow-sm",
                        currentColors.reference
                      )}
                    >
                      {getReferenceIcon(part.refType!)}
                      <span className="ml-1">{part.refTitle}</span>
                    </button>
                  );
                }
                return (
                  <span key={index} className="text-sm">
                    {part.content}
                  </span>
                );
              })}
            </div>
          </div>

          <div className={cn(
            "flex items-center mt-1 text-xs space-x-1",
            isOwnMessage ? currentColors.ownTime : currentColors.otherTime
          )}>
            <Clock className="h-3 w-3" />
            <span>{formatTime(message.createdAt)}</span>
            {isOwnMessage && (
              <>
                {message.isRead ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
                <span className="text-xs">
                  {message.isRead ? 'Lu' : 'Envoyé'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};