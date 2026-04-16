import styles from "@/styles/dom/DragonfireTools/DragonfireTutorial.module.scss";

/**
 * Animated hint: drag from the Items library (right) onto the 3D scene (left/center).
 */
export default function TutorialHandDragVisual() {
  return (
    <div className={styles.handDrag} aria-hidden>
      <div className={styles.handDragTrack}>
        <div className={styles.handDragScene}>
          <span className={styles.handDragSceneLabel}>Scene</span>
          <span className={styles.handDragSceneSub}>place here</span>
        </div>

        <div className={styles.handDragPath}>
          <svg
            className={styles.handDragArrowLine}
            viewBox="0 0 200 24"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="handDragGrad" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              d="M 198 12 L 12 12"
              fill="none"
              stroke="url(#handDragGrad)"
              strokeWidth="2"
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
            <path
              d="M 24 12 L 8 12 L 14 6 M 8 12 L 14 18"
              fill="none"
              stroke="#b91c1c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className={styles.handDragHandWrap}>
            <svg
              className={styles.handIcon}
              viewBox="0 0 64 64"
              width="48"
              height="48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M28 12c-2.5 0-4.5 2-4.5 4.5v14l-3.2-2.1a4 4 0 00-5 6.2l10 8.5c1.2 1 2.8 1.6 4.4 1.6H44c3.3 0 6-2.7 6-6V28.5c0-2.5-2-4.5-4.5-4.5s-4.5 2-4.5 4.5V22c0-2.5-2-4.5-4.5-4.5s-4.5 2-4.5 4.5v-5.5c0-2.5-2-4.5-4.5-4.5z"
                fill="rgba(185,28,28,0.12)"
                stroke="#b91c1c"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className={styles.handDragLibrary}>
          <span className={styles.handDragLibLabel}>Library</span>
          <span className={styles.handDragLibSub}>pick item</span>
        </div>
      </div>

      <p className={styles.handDragCaption}>
        Pull from the right panel and release on the floor or wall
      </p>
    </div>
  );
}
