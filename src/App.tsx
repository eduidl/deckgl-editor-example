// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { useState } from "react";
import DeckGL from "@deck.gl/react";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";
import {
  EditableGeoJsonLayer,
  DrawLineStringMode,
  DrawPointMode,
  DrawPolygonMode,
  ModifyMode,
  ViewMode,
} from "@deck.gl-community/editable-layers";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

import type { CSSProperties } from "react";
import type { MapViewState } from "@deck.gl/core";

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 139,
  latitude: 35,
  zoom: 4.5,
  maxZoom: 20,
  maxPitch: 60,
  bearing: 0,
};

const COPYRIGHT_LICENSE_STYLE: CSSProperties = {
  position: "absolute",
  right: 0,
  bottom: 0,
  backgroundColor: "hsla(0,0%,100%,.5)",
  padding: "0 5px",
  font: "12px/20px Helvetica Neue,Arial,Helvetica,sans-serif",
};

/* global window */
const devicePixelRatio =
  (typeof window !== "undefined" && window.devicePixelRatio) || 1;

type ModeType =
  | typeof ViewMode
  | typeof DrawPointMode
  | typeof DrawLineStringMode
  | typeof DrawPolygonMode
  | typeof ModifyMode;

const MODE_NAMES = [
  "View",
  "DrawPoint",
  "DrawLine",
  "DrawPolygon",
  "Modify",
] as const;
type ModeName = (typeof MODE_NAMES)[number];

const MODES: { [key in ModeName]: ModeType } = {
  View: ViewMode,
  DrawPoint: DrawPointMode,
  DrawLine: DrawLineStringMode,
  DrawPolygon: DrawPolygonMode,
  Modify: ModifyMode,
};

export default function App({ onTilesLoad }: { onTilesLoad?: () => void }) {
  const tileLayer = new TileLayer<ImageBitmap>({
    // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
    data: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],

    // Since these OSM tiles support HTTP/2, we can make many concurrent requests
    // and we aren't limited by the browser to a certain number per domain.
    maxRequests: 20,

    pickable: true,
    onViewportLoad: onTilesLoad,
    autoHighlight: false,
    highlightColor: [60, 60, 60, 40],
    // https://wiki.openstreetmap.org/wiki/Zoom_levels
    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    zoomOffset: devicePixelRatio === 1 ? -1 : 0,
    renderSubLayers: (props) => {
      const [[west, south], [east, north]] = props.tile.boundingBox;
      const { data, ...otherProps } = props;

      return [
        new BitmapLayer(otherProps, {
          image: data,
          bounds: [west, south, east, north],
        }),
      ];
    },
  });

  const [features, setFeatures] = useState([]);
  const [selectedFeatureIndexes, setSelectedFeatureIndexes] = useState<
    number[]
  >([]);
  const [currentMode, setMode] = useState<ModeName>("DrawPolygon");

  const validateAndSetSelectedFeatureIndex = (
    index: number,
    clearUnlessValid: boolean = false
  ) => {
    if (index !== undefined && 0 <= index && index < features.length) {
      setSelectedFeatureIndexes([index]);
    } else if (clearUnlessValid) {
      setSelectedFeatureIndexes([]);
    }
  };

  const editLayer = new EditableGeoJsonLayer({
    data: {
      type: "FeatureCollection",
      features: features,
    },
    mode: MODES[currentMode],
    selectedFeatureIndexes,

    // Styles
    pointRadiusMinPixels: 2,
    pointRadiusMaxPixels: 10,
    pointRadiusScale: 10,
    pickable: true,

    onEdit: ({ updatedData, editType, editContext }) => {
      setFeatures(updatedData.features);

      if (editType === "addFeature") {
        setSelectedFeatureIndexes(editContext.featureIndexes);
      }
    },
    onClick: ({ index }) => {
      if (currentMode === "View" || currentMode === "Modify") {
        validateAndSetSelectedFeatureIndex(index);
      }
    },
  });

  const Actions: { [key: string]: () => void } = {
    "Clear All": () => {
      setFeatures([]);
      setSelectedFeatureIndexes([]);
    },
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "1fr",
        gridTemplateColumns: "1fr 150px",
        width: "100vw",
        height: "100vh",
      }}
    >
      <div style={{ gridArea: 1 / 1, position: "relative" }}>
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={{
            doubleClickZoom: false,
          }}
          deviceProps={{ type: "webgl" }}
          layers={[tileLayer, editLayer]}
          // @ts-ignore
          getCursor={editLayer.getCursor.bind(editLayer)}
          // @ts-check
        />
        <div style={COPYRIGHT_LICENSE_STYLE}>
          {"© "}
          <a href="http://www.openstreetmap.org/copyright" target="blank">
            OpenStreetMap contributors
          </a>
        </div>
      </div>
      <div
        style={{
          gridArea: 1 / 2,
          background: "white",
          padding: "5px",
        }}
      >
        <FormControl fullWidth>
          <InputLabel id="mode-select-label">Select Mode</InputLabel>
          <Select
            labelId="mode-select-label"
            label="Select Mode"
            value={currentMode}
            onChange={(event) => {
              setMode(event.target.value as ModeName);
            }}
            style={{ width: "100%" }}
          >
            {MODE_NAMES.map((modeName) => (
              <MenuItem key={modeName} value={modeName}>
                {modeName}
              </MenuItem>
            ))}
          </Select>

          {Object.keys(Actions).map((actionName) => (
            <Button
              key={actionName}
              variant="contained"
              color="primary"
              style={{ width: "100%", marginTop: "5px" }}
              onClick={Actions[actionName]}
            >
              {actionName}
            </Button>
          ))}
        </FormControl>
      </div>
    </div>
  );
}
