import React, { useEffect, useRef, useState } from "react";
import { Text, useGLTF, Hud, OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import useAnimationStore from "@/stores/useAnimationStore";

const baseQuaternion = new THREE.Quaternion();

/*@TODO*/
//set up camera rotation here for easy drop in placement

const NavCubeContainer = ({
  controlsRef,
  orbitRadius,
  renderPriority,
  target = [0, 0, 0],
  /** Optional left offset in pixels (e.g. to clear a sidebar). Adds to the default position. */
  leftOffset = 0,
}) => {
  const { size, camera } = useThree();
  useEffect(() => {
    if (controlsRef) {
      if (controlsRef.current.target) {
        target = [...controlsRef.current.target];
      }
      controlsRef.current.setTarget(...target);
    }
  }, [controlsRef, target, renderPriority]);
  const camX = size.width / 2 - 80;
  return (
    <>
      <Hud renderPriority={!renderPriority ? 3 : renderPriority}>
        <OrthographicCamera
          makeDefault
          position={[camX, size.height / 2 - 80, 80]}
        />
        <NavCubeMesh camera={camera} />
      </Hud>
      <CameraAnimations controlsRef={controlsRef} orbitRadius={orbitRadius} />
    </>
  );
};

function NavCubeMesh(props) {
  const { camera } = props;
  const { invalidate } = useThree();

  const { nodes, materials } = useGLTF("/models/dragonfire-tools/nav_cube.glb");
  const navCubeRef = useRef();
  const [selectedMesh, setSelectedMesh] = useState(null);
  const [selectedMeshName, setSelectedMeshName] = useState(null);
  const [cameraPosition, setcameraPosition] = useState(camera.position);
  const [prevCameraPosition, setprevCameraPosition] = useState(null);
  // Save original materials to restore them after hover
  const originalMaterials = useRef({});
  const sides = [
    {
      text: "LEFT",
      position: [-1.086, 0, 0.002],
      rotation: [Math.PI / 2, -Math.PI / 2, Math.PI / 2],
      size: 0.28,
    },
    {
      text: "RIGHT",
      position: [1.086, 0, 0.002],
      rotation: [Math.PI / 2, Math.PI / 2, -Math.PI / 2],
      size: 0.28,
    },
    {
      text: "TOP",
      position: [-0.002, 1.086, 0],
      rotation: [-Math.PI / 2, 0, 0],
      size: 0.3,
    },
    {
      text: "BOTTOM",
      position: [-0.002, -1.126, -0.05],
      rotation: [-Math.PI / 2, Math.PI, Math.PI],
      size: 0.23,
    },
    {
      text: "FRONT",
      position: [-0.002, 0, 1.086],
      rotation: [0, 0, 0],
      size: 0.27,
    },
    {
      text: "BACK",
      position: [-0.002, 0, -1.086],
      rotation: [0, -Math.PI, 0],
      size: 0.3,
    },
  ];

  useEffect(() => {
    const cubeMesh = navCubeRef.current;

    if (cubeMesh) {
      cubeMesh.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshBasicMaterial({
            color: child.material?.color,
            toneMapped: false, // Prevent tone mapping from affecting NavCube
            // map: child.material?.map,
          });
        }
      });
    }

    //Event check the movement of the camera
    addEventListener("pointerup", CheckCamRotation);

    return () => {
      removeEventListener("pointerup", CheckCamRotation);
    };
  }, [navCubeRef, selectedMesh, selectedMeshName, camera.position]);

  const handleClick = (meshName, mesh) => {
    if (selectedMesh != null) {
      if (mesh != selectedMesh) {
        // Create a new material with a brighter highlighted appearance
        if (!originalMaterials.current[meshName]) {
          originalMaterials.current[meshName] = mesh.material.clone();
        }
        //Revert the material of previously selected mesh
        RevertToPreviousColor(selectedMeshName, selectedMesh);

        //Apply the material to currently selected mesh
        ApplyMaterialColor(mesh, "#f08322");

        //Update to latest selected mesh
        setSelectedMesh(mesh);
        setSelectedMeshName(meshName);
      }
    } else {
      setSelectedMeshName(meshName);
      setSelectedMesh(mesh);
      //Apply the material to currently selected mesh
      ApplyMaterialColor(mesh, "#f08322");
    }
    useAnimationStore.setState({ navCubeMeshNameSelect: meshName });
    invalidate();
  };

  const handlePointerEnter = (meshName, mesh) => {
    // Store the original material if we haven't already
    if (!originalMaterials.current[meshName]) {
      originalMaterials.current[meshName] = mesh.material.clone();
    }

    // Create a new material with a darker highlighted appearance
    if (selectedMesh !== mesh) {
      ApplyMaterialColor(mesh, "#914f14");
      invalidate();
    }

    if (props.onMeshHover) {
      // props.onMeshHover(meshName);
    }
  };

  const handlePointerLeave = (meshName, mesh) => {
    // Restore the original material
    if (mesh !== selectedMesh) {
      if (originalMaterials.current[meshName]) {
        mesh.material = originalMaterials.current[meshName];
        invalidate();
      }
    }

    if (props.onMeshLeave) {
      props.onMeshLeave(meshName);
      invalidate();
    }
  };

  const addEventHandlers = (meshProps, meshName) => ({
    ...meshProps,
    onClick: (event) => {
      event.stopPropagation();
      handleClick(meshName, event.object);
    },
    onPointerEnter: (event) => {
      event.stopPropagation();
      handlePointerEnter(meshName, event.object);
    },
    onPointerLeave: (event) => {
      event.stopPropagation();
      handlePointerLeave(meshName, event.object);
    },
  });

  //Helper Functions
  function RevertToPreviousColor(selectedMeshName, selectedMesh) {
    //Revert the material of previously selected mesh
    if (originalMaterials.current[selectedMeshName]) {
      selectedMesh.material = originalMaterials.current[selectedMeshName];
    }
  }

  function UnselectMesh() {
    setSelectedMesh(null);
    setSelectedMeshName(null);
  }

  function ApplyMaterialColor(mesh, color) {
    const cubeBrightness = 0.2;

    mesh.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      opacity: 0.8,
      transparent: true,
      map: mesh.material.map,
      toneMapped: false,
    });
  }

  function CheckCamRotation() {
    const currentPosition = [...camera.position];
    const positionsEqual = currentPosition.every(
      (value, index) => Math.abs(value - cameraPosition[index]) < 0.001
    );
    // console.log(cameraPositions[selectedMeshName], selectedMeshName);
    if (!positionsEqual) {
      // Camera position has changed
      if (selectedMesh) {
        // Deselect the current mesh
        RevertToPreviousColor(selectedMeshName, selectedMesh);
        UnselectMesh();
      }
      setcameraPosition(currentPosition);
      setprevCameraPosition(cameraPosition);
      invalidate();
      // console.log("Updated CamPos");
    }
    useAnimationStore.setState({ navCubeMeshNameSelect: null });
  }

  useFrame(() => {
    if (navCubeRef.current && camera) {
      const { rotation } = camera;
      const quaternion = baseQuaternion.clone().setFromEuler(rotation);
      //conjugate gives the "inverse" rotation since we're rotating something looking at the camera rather than the camera itself
      navCubeRef.current.quaternion.copy(quaternion.conjugate());
      invalidate();
    }
  });

  return (
    <group ref={navCubeRef} {...props} dispose={null} scale={40}>
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.top_right.geometry,
            material: materials.top_right_mat,
            position: [0.841, 0.826, 0],
          },
          "top_right"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.bottom_right.geometry,
            material: materials.bottom_right_mat,
            position: [0.841, -0.822, 0],
            rotation: [-Math.PI, 0, 0],
          },
          "bottom_right"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.top_left.geometry,
            material: materials.top_left_mat,
            position: [-0.845, 0.826, 0],
            rotation: [Math.PI, 0, Math.PI],
          },
          "top_left"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.bottom_left.geometry,
            material: materials.bottom_left_mat,
            position: [-0.845, -0.822, 0],
            rotation: [0, 0, Math.PI],
          },
          "bottom_left"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.top_front.geometry,
            material: materials.top_front_mat,
            position: [0, 0.826, 0.845],
            rotation: [0, -Math.PI / 2, 0],
          },
          "top_front"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.bottom_front.geometry,
            material: materials.bottom_front_mat,
            position: [0, -0.822, 0.845],
            rotation: [-Math.PI, 1.571, 0],
          },
          "bottom_front"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.top_back.geometry,
            material: materials.top_back_mat,
            position: [0, 0.826, -0.845],
            rotation: [0, 1.571, 0],
          },
          "top_back"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.bottom_back.geometry,
            material: materials.bottom_back_mat,
            position: [0, -0.822, -0.845],
            rotation: [-Math.PI, -Math.PI / 2, 0],
          },
          "bottom_back"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.back_right.geometry,
            material: materials.back_right_mat,
            position: [0.826, 0, -0.845],
            rotation: [Math.PI / 2, 0, -Math.PI / 2],
          },
          "back_right"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.back_left.geometry,
            material: materials.back_left_mat,
            position: [-0.822, 0, -0.845],
            rotation: [-Math.PI / 2, 0, Math.PI / 2],
          },
          "back_left"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.front_right.geometry,
            material: materials.front_right_mat,
            position: [0.826, 0, 0.838],
            rotation: [-Math.PI / 2, 0, -Math.PI / 2],
          },
          "front_right"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.front_left.geometry,
            material: materials.front_left_mat,
            position: [-0.822, 0, 0.838],
            rotation: [Math.PI / 2, 0, Math.PI / 2],
          },
          "front_left"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.top_front_right.geometry,
            material: materials.top_front_right_mat,
            position: [0.842, 0.826, 0.845],
            rotation: [0, Math.PI / 2, 0],
          },
          "top_front_right"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.top_back_right.geometry,
            material: materials.top_back_right_mat,
            position: [0.845, 0.826, -0.842],
            rotation: [Math.PI, 0, Math.PI],
          },
          "top_back_right"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.top_back_left.geometry,
            material: materials.top_back_left_mat,
            position: [-0.842, 0.826, -0.845],
            rotation: [0, -Math.PI / 2, 0],
          },
          "top_back_left"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.top_front_left.geometry,
            material: materials.top_front_left_mat,
            position: [-0.845, 0.826, 0.842],
            // rotation: [0, -Math.PI / 2, 0],
          },
          "top_front_left"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.bottom_back_right.geometry,
            material: materials.bottom_back_right_mat,
            position: [0.842, -0.826, -0.845],
            rotation: [-Math.PI, 1.571, 0],
          },
          "bottom_back_right"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.bottom_front_right.geometry,
            material: materials.bottom_front_right_mat,
            position: [0.845, -0.826, 0.842],
            rotation: [0, 0, -Math.PI],
          },
          "bottom_front_right"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.bottom_front_left.geometry,
            material: materials.bottom_front_left_mat,
            position: [-0.842, -0.826, 0.845],
            rotation: [-Math.PI, -Math.PI / 2, 0],
          },
          "bottom_front_left"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.bottom_back_left.geometry,
            material: materials.bottom_back_left_mat,
            position: [-0.845, -0.826, -0.842],
            rotation: [-Math.PI, 0, 0],
          },
          "bottom_back_left"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.top.geometry,
            material: materials.top_mat,
            position: [-0.002, 0.826, 0],
            // rotation: [-Math.PI, 0, 0],
          },
          "top"
        )}
      />

      {
        <mesh
          {...addEventHandlers(
            {
              geometry: nodes.front.geometry,
              material: materials.front_mat,
              position: [-0.002, 0, 0.826],
              rotation: [Math.PI / 2, 0, 0],
            },
            "front"
          )}
        />
      }

      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.bottom.geometry,
            material: materials.bottom_mat,
            position: [-0.002, -0.826, 0],
            rotation: [-Math.PI, 0, 0],
          },
          "bottom"
        )}
      />

      {/* <Text3D {...textOptions}>
        Hello world!
        <meshNormalMaterial />
      </Text3D> */}
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.back.geometry,
            material: materials.back_mat,
            position: [-0.002, 0, -0.826],
            rotation: [-Math.PI / 2, 0, 0],
          },
          "back"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.right.geometry,
            material: materials.right_mat,
            position: [0.826, 0, 0.002],
            rotation: [Math.PI / 2, 0, -Math.PI / 2],
          },
          "right"
        )}
      />
      <mesh
        {...addEventHandlers(
          {
            geometry: nodes.left.geometry,
            material: materials.left_mat,
            position: [-0.826, 0, 0.002],
            rotation: [-Math.PI / 2, 0, Math.PI / 2],
          },
          "left"
        )}
      />

      {sides.map((side, i) => {
        return (
          <Text
            key={i}
            scale={1}
            fontSize={side.size}
            fontWeight={900}
            color={"#354535"}
            position={side.position}
            rotation={side.rotation}
            anchorX="center"
            anchorY="middle"
          >
            {side.text}
          </Text>
        );
      })}
    </group>
  );
}

useGLTF.preload("/models/dragonfire-tools/nav_cube.glb");

export { NavCubeContainer as NavCube };

//////////////////////////
///CAMERA ANIMATIONS
////////////////////////
const EPSILON = 0.0001;
// const navOrbitRadius = 130;

const cameraPositions = {
  top: {
    quaternion: [-0.70714213564 + EPSILON, 0, 0, 0.70714213564 - EPSILON],
  },
  bottom: {
    quaternion: [-0.70714213564 + EPSILON, 0, 0, -0.70614213564 + EPSILON],
  },
  front: {
    quaternion: [0, 0, 0, 1],
  },
  back: {
    quaternion: [0, 1, 0, 0],
  },
  left: {
    quaternion: [0, -0.7071068, 0, 0.7071068],
  },
  right: {
    quaternion: [0, 0.7071068, 0, 0.7071068],
  },
  // Top and Bottom side positions
  top_front: {
    quaternion: [-0.3826834, 0, 0, 0.9238795],
  },
  top_back: {
    quaternion: [0, -0.9238795, -0.3826834, 0],
  },
  top_left: {
    quaternion: [-0.2705981, -0.6532815, -0.2705981, 0.6532815],
  },
  top_right: {
    quaternion: [-0.2705981, 0.6532815, 0.2705981, 0.6532815],
  },
  bottom_front: {
    quaternion: [0.3826834, 0, 0, 0.9238795],
  },
  bottom_back: {
    quaternion: [0, 0.9238795, -0.3826834, 0],
  },
  bottom_left: {
    quaternion: [0.2705981, -0.6532815, 0.2705981, 0.6532815],
  },
  bottom_right: {
    quaternion: [0.2705981, 0.6532815, -0.2705981, 0.6532815],
  },
  ///Front and Back side positions
  front_left: {
    quaternion: [0, -0.3826834, 0, 0.9238795],
  },
  front_right: {
    quaternion: [0, 0.3826834, 0, 0.9238795],
  },
  back_left: {
    quaternion: [0, -0.9238795, 0, 0.3826834],
  },
  back_right: {
    quaternion: [0, 0.9238795, 0, 0.3826834],
  },
  //The Corners
  top_back_right: {
    quaternion: [-0.1462514, 0.853571, 0.3536613, 0.3534837],
  },
  top_back_left: {
    quaternion: [-0.1464004, -0.8535455, -0.3535996, 0.3535455],
  },
  top_front_left: {
    quaternion: [-0.3535996, -0.3535455, -0.1464004, 0.8535455],
  },
  top_front_right: {
    quaternion: [-0.3535996, 0.3535455, 0.1464004, 0.8535455],
  },
  bottom_back_right: {
    quaternion: [0.1464004, 0.8535455, -0.3535996, 0.3535455],
  },
  bottom_back_left: {
    quaternion: [0.1464004, -0.8535455, 0.3535996, 0.3535455],
  },
  bottom_front_left: {
    quaternion: [0.3535996, -0.3535455, 0.1464004, 0.8535455],
  },
  bottom_front_right: {
    quaternion: [0.3535996, 0.3535455, -0.1464004, 0.8535455],
  },
};

const CameraAnimations = ({ controlsRef, orbitRadius }) => {
  const { camera, invalidate } = useThree();
  const navCubeMeshNameSelect = useAnimationStore(
    (state) => state.navCubeMeshNameSelect
  );

  const animateCamera = (targetQuaternion, target) => {
    if (!controlsRef.current) return;

    const _targetLookAt = new THREE.Vector3(...target);
    controlsRef.current.transitionTime = 2;
    // Calculate the end position based on the target quaternion
    const endQuaternion = new THREE.Quaternion(...targetQuaternion);
    const endPoint = new THREE.Vector3(0, 0, orbitRadius)
      .applyQuaternion(endQuaternion)
      .add(_targetLookAt);

    controlsRef.current.setLookAt(
      endPoint.x,
      endPoint.y,
      endPoint.z, // camera position
      _targetLookAt.x,
      _targetLookAt.y,
      _targetLookAt.z, // target position
      true // enable transition
    );
    invalidate();
  };

  useEffect(() => {
    if (!navCubeMeshNameSelect) return;
    const baseMeshName = navCubeMeshNameSelect.toLowerCase();

    // Find the corresponding camera position
    const targetCameraPosition = cameraPositions[baseMeshName];
    if (targetCameraPosition) {
      if (!controlsRef.current) return;
      // console.log(controlsRef.current);
      // controlsRef.current._target.set(0, 0, 0);
      // controlsRef.current._target.set(...controlsRef.current.target);
      const target = [
        controlsRef.current._target.x,
        controlsRef.current._target.y,
        controlsRef.current._target.z,
      ];
      animateCamera(targetCameraPosition.quaternion, target);
      invalidate();
    }

    return () => { };
  }, [navCubeMeshNameSelect, controlsRef, orbitRadius]);

  return <></>;
};
