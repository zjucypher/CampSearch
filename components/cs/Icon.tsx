import {
  Search, Bell, Map, MapPin, Calendar, User, Plus, Check,
  ChevronRight, ChevronDown, Mail, Smartphone, Tent, Settings,
  Grid2x2, List, ArrowRight, SlidersHorizontal, Play, Pause,
  Flame, Sparkles, X, Sun, Moon, Download, RefreshCw, Zap, TreePine,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

const ICONS = {
  search: Search,
  bell: Bell,
  map: Map,
  pin: MapPin,
  calendar: Calendar,
  user: User,
  plus: Plus,
  check: Check,
  chevron: ChevronRight,
  chevronDown: ChevronDown,
  mail: Mail,
  phone: Smartphone,
  tent: Tent,
  settings: Settings,
  grid: Grid2x2,
  list: List,
  arrow: ArrowRight,
  sliders: SlidersHorizontal,
  play: Play,
  pause: Pause,
  flame: Flame,
  sparkles: Sparkles,
  x: X,
  sun: Sun,
  moon: Moon,
  download: Download,
  refresh: RefreshCw,
  bolt: Zap,
  tree: TreePine,
} as const;

export type IconName = keyof typeof ICONS;

type Props = LucideProps & { name: IconName };

export default function Icon({ name, size = 16, strokeWidth = 1.6, ...rest }: Props) {
  const Component = ICONS[name];
  return <Component size={size} strokeWidth={strokeWidth} {...rest} />;
}
