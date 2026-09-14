import Link from "next/link";
import styles from "./ButtonLink.module.css";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
};

export function ButtonLink({ href, children, variant = "primary" }: Props) {
  return (
    <Link
      href={href}
      className={`${styles.btn} ${variant === "ghost" ? styles.ghost : styles.primary}`}
    >
      {children}
    </Link>
  );
}
