import { Image, StyleSheet, View } from "react-native";
import { modalKit } from "../assets";
import { NineSlice } from "./NineSlice";

// The default frame scale, and how far down from a modal's top its content should start so
// it clears the gem (which sits on the top rail and hangs a little into the panel).
export const MODAL_FRAME_SCALE = 0.42;
export const MODAL_CONTENT_TOP = 40;

// Every modal's outermost frame: drop it in as the panel's first child, like a NineSlice.
// The gold-trimmed parchment stretches to the panel; the gem stays its own size, top-centre.
export function ModalFrame({ scale = MODAL_FRAME_SCALE }: { scale?: number }) {
  return (
    <>
      <NineSlice slice={modalKit.frame} scale={scale} />
      <View style={styles.gemRow} pointerEvents="none">
        <Image source={modalKit.gem} style={{ width: modalKit.gemWidth * scale, height: modalKit.gemHeight * scale }} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  gemRow: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", zIndex: 1 },
});
