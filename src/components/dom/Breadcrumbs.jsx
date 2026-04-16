import Link from "next/link";
import { useRouter } from "next/router";
import { AiOutlineRight } from "react-icons/ai";
import styles from "@/styles/dom/Breadcrumbs.module.css";

const Breadcrumbs = ({ breadcrumbsIsVisible = true }) => {
  const router = useRouter();
  const { pathname } = router;

  const crumbs = pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on homepage
  if (pathname === "/") return null;

  return (
    <nav className={styles.breadcrumbs}>
      {breadcrumbsIsVisible ? (
        <ul className={styles.list}>
          <li className={styles.item}>
            <Link href="/">Manufacturers</Link>
          </li>
          {crumbs.map((crumb, index) => {
            const path = `/${crumbs.slice(0, index + 1).join("/")}`;
            const isLast = index === crumbs.length - 1;

            return (
              <li key={path} className={styles.item}>
                <AiOutlineRight className={styles.icon} />
                {isLast ? (
                  <span className={styles.active}>
                    {decodeURIComponent(crumb)}
                  </span>
                ) : (
                  <Link href={path}>{decodeURIComponent(crumb)}</Link>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        ""
      )}
    </nav>
  );
};

export default Breadcrumbs;
