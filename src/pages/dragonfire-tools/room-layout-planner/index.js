import BaseCanvas from "@/components/canvas/DragonfireTools/BaseCanvas";
// import Navbar from "@/components/dom/Navbar";
import Breadcrumbs from "@/components/dom/Breadcrumbs";
import Head from "next/head";
import DragonfireToolsSidebar from "@/components/dom/DragonfireTools/DragonfireToolsSidebar";
import CabinetOptionsToDrag from "@/components/dom/DragonfireTools/CabinetOptionsToDrag";
import SceneActionsPanel from "@/components/dom/DragonfireTools/SceneActionsPanel";
import { DragonfireTutorialProvider } from "@/components/dom/DragonfireTools/DragonfireTutorialContext";
import DragonfireTutorialInteractionBridge from "@/components/dom/DragonfireTools/DragonfireTutorialInteractionBridge";
import DragonfireTutorialOverlay from "@/components/dom/DragonfireTools/DragonfireTutorialOverlay";

export default function RoomLayoutPlanner(props) {
  return (
    <DragonfireTutorialProvider>
      <div>
        <Head>
          <title>Plan Cabinet Layout</title>
        </Head>
        {/* <Navbar hasBackButton={false} /> */}
        <Breadcrumbs />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <style global jsx>
          {
            "html,body,body>div:first-child,div#__next,div#__next > div {height: 100%}"
          }
        </style>
        {/* <Dom /> */}
        <BaseCanvas />
        <CabinetOptionsToDrag />
        <SceneActionsPanel />
        <DragonfireToolsSidebar />
        <DragonfireTutorialInteractionBridge />
        <DragonfireTutorialOverlay />
      </div>
    </DragonfireTutorialProvider>
  );
}
