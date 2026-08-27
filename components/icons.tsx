import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from "@hugeicons/react";
import {
  Activity01Icon,
  AlertCircleIcon,
  ArrowDownRight01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  BadgeCheckIcon,
  BalanceScaleIcon,
  BinaryIcon,
  BlocksIcon,
  ChartNoAxesCombinedIcon,
  CheckmarkCircle02Icon,
  CircleGaugeIcon,
  CircleSlashTwoIcon,
  Clock03Icon,
  Coins01Icon,
  DatabaseZapIcon,
  GaugeIcon,
  HandCoinsIcon,
  MinusSignIcon,
  Money03Icon,
  Radar01Icon,
  RadioTowerIcon,
  Shield01Icon,
  ShieldCheckIcon,
  SigmaIcon,
  TimerResetIcon,
  UsersIcon,
} from "@hugeicons/core-free-icons";

type IconProps = Omit<HugeiconsIconProps, "icon">;

function createIcon(icon: IconSvgElement) {
  return function Icon({ strokeWidth = 1.7, ...props }: IconProps) {
    return <HugeiconsIcon icon={icon} strokeWidth={strokeWidth} {...props} />;
  };
}

export const Activity = createIcon(Activity01Icon);
export const ArrowDownRight = createIcon(ArrowDownRight01Icon);
export const ArrowRight = createIcon(ArrowRight01Icon);
export const ArrowUpRight = createIcon(ArrowUpRight01Icon);
export const BadgeCheck = createIcon(BadgeCheckIcon);
export const Banknote = createIcon(Money03Icon);
export const Binary = createIcon(BinaryIcon);
export const Blocks = createIcon(BlocksIcon);
export const ChartNoAxesCombined = createIcon(ChartNoAxesCombinedIcon);
export const Check = createIcon(CheckmarkCircle02Icon);
export const CircleAlert = createIcon(AlertCircleIcon);
export const CircleGauge = createIcon(CircleGaugeIcon);
export const CircleSlash2 = createIcon(CircleSlashTwoIcon);
export const Clock3 = createIcon(Clock03Icon);
export const Coins = createIcon(Coins01Icon);
export const DatabaseZap = createIcon(DatabaseZapIcon);
export const Gauge = createIcon(GaugeIcon);
export const HandCoins = createIcon(HandCoinsIcon);
export const Minus = createIcon(MinusSignIcon);
export const Radar = createIcon(Radar01Icon);
export const RadioTower = createIcon(RadioTowerIcon);
export const Scale = createIcon(BalanceScaleIcon);
export const Shield = createIcon(Shield01Icon);
export const ShieldCheck = createIcon(ShieldCheckIcon);
export const Sigma = createIcon(SigmaIcon);
export const TimerReset = createIcon(TimerResetIcon);
export const Users = createIcon(UsersIcon);
