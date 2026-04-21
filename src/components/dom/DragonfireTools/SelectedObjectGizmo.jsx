// import { Html } from "@react-three/drei";
// import styles from "@/styles/dom/DragonfireTools/SelectedObjectGizmo.module.scss";
// import useDragNDropStore from "@/stores/useDragNDropStore";

// export default function SelectedObjectGizmo({
//   position = [0, 0, 0],
//   onDelete,
//   onDuplicate,
//   onRotate,
//   onFavorite,
//   onMoveUpDown,
//   onReset,
//   visible = false,
// }) {
//   const selectedPlacedIndex = useDragNDropStore(
//     (state) => state.selectedPlacedIndex
//   );

//   if (!visible || selectedPlacedIndex == null) return null;

//   return (
//     <Html position={position} center distanceFactor={8}>
//       <div className={styles.wrapper}>

//         {/* TOP CONTROLS */}
//         <div className={styles.topRow}>
//           <button className={styles.btn} onClick={onMoveUpDown}>
//             ⇅
//           </button>
//           <button className={styles.btn} onClick={onDuplicate}>
//             ⧉
//           </button>
//           <button className={styles.btn} onClick={onFavorite}>
//             ❤
//           </button>
          
//         </div>

//         {/* CENTER BOX (DELETE / CLOSE) */}
//         <div className={styles.centerBox}>
//           <div className={styles.closeBtn} onClick={onReset}>
//             ✕
//           </div>
//         </div>

//         {/* SIDE CONTROLS */}
//         <div className={styles.sideRow}>
//           <button className={styles.btn} onClick={onRotate}>
//             ⟳
//           </button>
//           <button className={styles.btn} onClick={onDelete}>
//             🗑
//           </button>
//         </div>

//       </div>
//     </Html>
//   );
// }
