import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import styles from "@/styles/dom/Navbar.module.css";
import { IoSearchSharp } from "react-icons/io5";
import useAuthStore from "@/stores/useAuthStore";
import { TiArrowBack } from "react-icons/ti";
import Link from "next/link";

function Navbar({ searchIsVisible = true, hasBackButton = true }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const userImage = useAuthStore((state) => state.userImage);
  const authorizedManufacturer = useAuthStore(
    (state) => state.authorizedManufacturer,
  );
  const router = useRouter();
  const isHomepage = router.pathname === "/";
  const [searchQuery, setSearchQuery] = useState("");
  const [manufacturers, setManufacturers] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const [error, setError] = useState(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const response = await fetch("/api/pages");
        if (response.ok) {
          const data = await response.json();
          setManufacturers(data.manufacturers);
        } else {
          // setError("Failed to fetch manufacturers");
          console.error("Failed to fetch manufacturers");
        }
      } catch (error) {
        // setError("Error fetching manufacturers");
        console.error("Error fetching manufacturers");
      }
    };

    fetchManufacturers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredResults({
        manufacturers: [],
        products: [],
      });
    } else {
      const groupedResults = {
        manufacturers: [],
        products: [],
      };

      manufacturers.forEach((manufacturer) => {
        const { path, pages, title, slug } = manufacturer;

        // const manufacturerMatches =
        //   title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;

        const filteredProducts = (pages || []).filter(
          (product) =>
            product.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
            authorizedManufacturer == slug,
        );

        // if (manufacturerMatches) {
        //   groupedResults.manufacturers.push({
        //     manufacturerPath: path,
        //     manufacturerTitle: title,
        //   });
        // }

        if (filteredProducts.length > 0) {
          groupedResults.products.push(
            ...filteredProducts.map((product) => ({
              productPath: product.path,
              productTitle: product.title,
              manufacturerTitle: title,
              manufacturerPath: path,
            })),
          );
        }
      });

      setFilteredResults(groupedResults);
      setIsResultsVisible(true);
    }
  }, [searchQuery, manufacturers]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsResultsVisible(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputFocus = () => {
    if (searchQuery.trim() !== "") {
      setIsResultsVisible(true);
    }
  };

  return (
    <nav className={styles.navbar}>
      {!isHomepage && hasBackButton && (
        <button
          className={styles.backButton}
          onClick={() => router.back()}
          disabled={isHomepage}
        >
          <TiArrowBack className={styles.backButtonIcon} />
        </button>
      )}
      {/* change to link */}
      <Link className={styles.logoContainer} href="/">
        <img alt="Spokbee Logo" src="/logo.png" className={styles.logo} />
      </Link>
      {/* {searchIsVisible ? ( */}
      {/*   <section className={styles.searchBoxWrapper} ref={searchContainerRef}> */}
      {/*     <div className={styles.searchBoxContainer}> */}
      {/*       <IoSearchSharp className={styles.searchIcon} /> */}
      {/*       <input */}
      {/*         type="text" */}
      {/*         placeholder="Search..." */}
      {/*         className={styles.searchBox} */}
      {/*         value={searchQuery} */}
      {/*         onChange={(e) => setSearchQuery(e.target.value)} */}
      {/*         onFocus={handleInputFocus} */}
      {/*         onKeyDown={(e) => { */}
      {/*           if (e.key === "Enter") { */}
      {/*             router.push( */}
      {/*               `/search?q=${encodeURIComponent(searchQuery.trim())}`, */}
      {/*             ); */}
      {/*             setIsResultsVisible(false); */}
      {/*           } */}
      {/*         }} */}
      {/*       /> */}
      {/*     </div> */}

      {/*     {isResultsVisible && */}
      {/*       (filteredResults.manufacturers.length > 0 || */}
      {/*         filteredResults.products.length > 0) && ( */}
      {/*         <div className={styles.searchResults}> */}
      {/*           {/\* Products Section *\/} */}
      {/*           {filteredResults.products.length > 0 && ( */}
      {/*             <div className={styles.productsSection}> */}
      {/*               {/\* <h3 className={styles.sectionTitle}>Products</h3> *\/} */}
      {/*               <ul className={styles.productsList}> */}
      {/*                 {filteredResults.products.map((product, index) => ( */}
      {/*                   <li */}
      {/*                     key={`product-${index}`} */}
      {/*                     className={styles.result} */}
      {/*                     onClick={() => router.push(product.productPath)} */}
      {/*                   > */}
      {/*                     {product.productTitle} */}
      {/*                   </li> */}
      {/*                 ))} */}
      {/*               </ul> */}
      {/*             </div> */}
      {/*           )} */}

      {/*           {/\* Manufacturers Section *\/} */}
      {/*           {filteredResults.manufacturers.length > 0 && ( */}
      {/*             <div className={styles.manufacturersSection}> */}
      {/*               {/\* <h3 className={styles.sectionTitle}>Manufacturers</h3> *\/} */}
      {/*               <ul className={styles.manufacturersList}> */}
      {/*                 {filteredResults.manufacturers.map( */}
      {/*                   (manufacturer, index) => ( */}
      {/*                     <li */}
      {/*                       key={`manufacturer-${index}`} */}
      {/*                       className={styles.result} */}
      {/*                       onClick={() => */}
      {/*                         router.push(manufacturer.manufacturerPath) */}
      {/*                       } */}
      {/*                     > */}
      {/*                       {manufacturer.manufacturerTitle} */}
      {/*                     </li> */}
      {/*                   ), */}
      {/*                 )} */}
      {/*               </ul> */}
      {/*             </div> */}
      {/*           )} */}
      {/*         </div> */}
      {/*       )} */}

      {/*     {/\* {error && <div className={styles.error}>{error}</div>} *\/} */}
      {/*   </section> */}
      {/* ) : ( */}
      {/*   "" */}
      {/* )} */}

      <section className={styles.userProfileSection}>
        <div className={styles.userAvatar}>
          <img
            src={userImage}
            alt="User Avatar"
            className={styles.avatarImage}
          />
        </div>
        <span className={styles.username}>{currentUser}</span>
      </section>
    </nav>
  );
}

export default Navbar;
