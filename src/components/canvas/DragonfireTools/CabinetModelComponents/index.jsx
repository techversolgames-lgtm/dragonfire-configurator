import FiftySixInchTemplate from "./worktable/56InchTemplate";
import TwelveDrawersTemplate from "./7ftCabinets/12DrawersTemplate";
import SeventeenDrawersTemplate from "./7ftCabinets/17DrawersTemplate";
import TwentyFourDrawersTemplate from "./7ftCabinets/24DrawersTemplate";
import EighteenDrawersTemplate from "./9ftCabinets/18DrawersTemplate";
import TwentyDrawersTemplate from "./9ftCabinets/20DrawersTemplate";
import ThirtyDrawersTemplate from "./9ftCabinets/30DrawersTemplate";
import LockerTemplate from "./standingCabinets/LockerTemplate";
import SixDrawersTemplate from "./standingCabinets/6DrawersTemplate";
import ElevenDrawersTemplate from "./standingCabinets/11DrawersTemplate";
import LowerCornerTemplate from "./standingCabinets/LowerCornerTemplate";
import UpperCornerTemplate from "./standingCabinets/UpperCornerTemplate";
import WallCabinetTemplate from "./standingCabinets/WallCabinetTemplate";
import ThreeWallCabinetsTemplate from "./standingCabinets/3WallCabinetsTemplate";
import FourWallCabinetsTemplate from "./standingCabinets/4WallCabinetsTemplate";
import FiftySixInchWorktablePTemplate from "./cabinetPackages/56WorktablePTemplate";
import TwelveDrawerPTemplate from "./cabinetPackages/12DrawerPTemplate";
import SeventeenDrawerPTemplate from "./cabinetPackages/17DrawerPTemplate";
import EighteenDrawerPTemplate from "./cabinetPackages/18DrawerPTemplate";
import TwentyDrawerPTemplate from "./cabinetPackages/20DrawerPTemplate";
import TwentyFourDrawerPTemplate from "./cabinetPackages/24DrawerPTemplate";
import ThirtyDrawerPTemplate from "./cabinetPackages/30DrawerPTemplate";
import TVModel from "../RoomItemModels/TVModel";
import DoorModel from "../RoomItemModels/DoorModel";
import WindowModel from "../RoomItemModels/WindowModel";
import CharacterModel from "../RoomItemModels/CharacterModel";

const cabinetModelsMap = {
  1: FiftySixInchTemplate,
  2: TwelveDrawersTemplate,
  3: SeventeenDrawersTemplate,
  4: TwentyFourDrawersTemplate,
  5: EighteenDrawersTemplate,
  6: TwentyDrawersTemplate,
  7: ThirtyDrawersTemplate,

  // 🔥 FIXED SECTION
  9: SixDrawersTemplate,

  // ❗ yeh galat hai agar 22 drawer hai
  10: ElevenDrawersTemplate, // replace with correct template

  11: LowerCornerTemplate,
  12: UpperCornerTemplate,
  13: WallCabinetTemplate,
  14: ThreeWallCabinetsTemplate,
  15: FourWallCabinetsTemplate,

  16: LockerTemplate,

  17: TwelveDrawerPTemplate,

  100: TVModel,
  101: DoorModel,
  102: WindowModel,
  103: CharacterModel,
};

export default cabinetModelsMap;
