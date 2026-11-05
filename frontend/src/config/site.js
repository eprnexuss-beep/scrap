// Contact details used by the WhatsApp button (change them here, in one place).
export const WHATSAPP_NUMBER = '919286595966' // country code + number, digits only (+91 9286595966)
export const WHATSAPP_MESSAGE = "Hello, I'm looking to buy or sell scrap."

export const whatsappUrl = (message = WHATSAPP_MESSAGE) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
