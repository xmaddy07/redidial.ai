import React from 'react'
import { View, Text } from 'react-native'
import {
  isBulletListBlock,
  splitStructuredMessageBlocks,
} from '../../utils/chatMessageParser'

export default function FormattedChatMessage({
  text,
  style,
  blockStyle,
  listItemStyle,
}) {
  const blocks = splitStructuredMessageBlocks(text)

  if (blocks.length === 0) return null

  return (
    <View>
      {blocks.map((block, blockIndex) => {
        const blockSpacing = blockIndex > 0 ? blockStyle : null

        if (isBulletListBlock(block)) {
          const items = block
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)

          return (
            <View key={`list-${blockIndex}`} style={blockSpacing}>
              {items.map((item, itemIndex) => (
                <Text
                  key={`item-${blockIndex}-${itemIndex}`}
                  style={[style, itemIndex > 0 && listItemStyle]}
                >
                  {item}
                </Text>
              ))}
            </View>
          )
        }

        return (
          <Text key={`para-${blockIndex}`} style={[style, blockSpacing]}>
            {block}
          </Text>
        )
      })}
    </View>
  )
}
