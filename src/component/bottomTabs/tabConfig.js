/** @typedef {'Dashboard' | 'Leads' | 'Chat' | 'TeamMessages' | 'Settings'} MainTabRoute */

/** @type {Record<MainTabRoute, string>} */
export const MAIN_TAB_LABELS = {
  Dashboard: 'Home',
  Leads: 'Leads',
  Chat: 'Chat',
  TeamMessages: 'Team',
  Settings: 'Settings',
}

/** @returns {Record<MainTabRoute, { outline: string, filled: string }>} */
export function getMainTabIosSymbols() {
  return {
    Dashboard: { outline: 'house', filled: 'house.fill' },
    Leads: { outline: 'chart.bar', filled: 'chart.bar.fill' },
    Chat: { outline: 'bubble.left.and.bubble.right', filled: 'bubble.left.and.bubble.right.fill' },
    TeamMessages: { outline: 'person.bubble', filled: 'person.bubble.fill' },
    Settings: { outline: 'gearshape', filled: 'gearshape.fill' },
  }
}

export function getMainTabLabels() {
  return MAIN_TAB_LABELS
}

/** @param {{ outline: string, filled: string }} entry */
export function iosTabIcon(entry) {
  return ({ focused }) => ({
    type: 'sfSymbol',
    name: focused ? entry.filled : entry.outline,
  })
}

/**
 * @param {ReturnType<typeof getMainTabIosSymbols>} symbols
 * @param {Record<MainTabRoute, string>} labels
 */
export function screenOptionsFor(symbols, labels) {
  return (routeName) => {
    const entry = symbols[routeName]
    const label = labels[routeName]

    return {
      title: label,
      tabBarLabel: label,
      tabBarIcon: iosTabIcon(entry),
    }
  }
}
