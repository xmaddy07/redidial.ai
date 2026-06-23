import React from 'react';
import { View, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../theme/layout';
import SkeletonBone from './SkeletonBone';

function BubbleSkeleton({ align = 'left' }) {
  const isRight = align === 'right';

  return (
    <View style={[styles.row, isRight ? styles.rowRight : styles.rowLeft]}>
      <SkeletonBone
        width={isRight ? wp(52) : wp(58)}
        height={hp(5.5)}
        borderRadius={12}
      />
    </View>
  );
}

export default function MessagesSkeleton({ count = 6, style, flex }) {
  const pattern = ['left', 'right', 'left', 'left', 'right', 'left'];

  return (
    <View style={[styles.container, flex && styles.flex, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <BubbleSkeleton
          key={`msg-skeleton-${index}`}
          align={pattern[index % pattern.length]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    justifyContent: 'flex-end',
  },
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  row: {
    width: '100%',
    marginVertical: 6,
  },
  rowLeft: {
    alignItems: 'flex-start',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
});
