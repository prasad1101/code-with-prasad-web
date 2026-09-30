import type { IconType } from 'react-icons'
import {
  FaDev,
  FaEnvelope,
  FaGithub,
  FaGlobe,
  FaLinkedinIn,
  FaMedium,
  FaStackOverflow,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6'

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const SOCIAL: Record<string, IconType> = {
  github: FaGithub,
  linkedin: FaLinkedinIn,
  x: FaXTwitter,
  twitter: FaXTwitter,
  youtube: FaYoutube,
  medium: FaMedium,
  dev: FaDev,
  stackoverflow: FaStackOverflow,
  email: FaEnvelope,
  website: FaGlobe,
}

export const socialIcon = (platform: string): IconType => SOCIAL[norm(platform)] ?? FaGlobe

const LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  x: 'X',
  youtube: 'YouTube',
}
export const socialLabel = (platform: string) =>
  LABELS[norm(platform)] ?? platform.charAt(0).toUpperCase() + platform.slice(1)
