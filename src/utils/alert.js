const listeners = new Set()

export function subscribeAlert(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(config) {
  listeners.forEach((listener) => listener(config))
}

function normalizeButtons(buttons) {
  if (!buttons || buttons.length === 0) {
    return [{ text: 'OK', style: 'default', userOnPress: null }]
  }

  return buttons.map((button) => {
    if (typeof button === 'string') {
      return { text: button, style: 'default', userOnPress: null }
    }

    const { text = 'OK', style = 'default', onPress } = button
    return { text, style, userOnPress: onPress ?? null }
  })
}

export function showAlert(title, message, buttons, options = {}) {
  return new Promise((resolve) => {
    const dismiss = (buttonIndex = 0) => {
      resolve(buttonIndex)
    }

    emit({
      visible: true,
      title: title ?? '',
      message: message ?? '',
      buttons: normalizeButtons(buttons),
      cancelable: options.cancelable !== false,
      onDismiss: dismiss,
    })
  })
}

/** Drop-in replacement for React Native Alert */
export const Alert = {
  alert: showAlert,
}

export default Alert
