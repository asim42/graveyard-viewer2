import { Component, OnInit } from '@angular/core'

import 'ol/ol.css'
import GeoJSON from 'ol/format/GeoJSON'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import OlMap from 'ol/Map'
import { OSM, Vector as VectorSource } from 'ol/source'
import { Fill, Stroke, Style } from 'ol/style'
import View from 'ol/View'
import { getCenter } from 'ol/extent'
import { GraveyardDataService } from './services/graveyard-data.service'
import { FeatureCollection } from 'geojson'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  map: OlMap
  title: string
  data: FeatureCollection | undefined

  numberOfGraveyards: number
  numberOfGravesInBuschhoven: number
  gravePlotFields: Array<string>
  graveyardWithMostUnassigned: [string, number]

  constructor(private graveyardDataService: GraveyardDataService) {
    this.map = new OlMap({})
    this.title = 'Graveyard Viewer'
    this.data = undefined
  }

  get friedhofs () : string[] {
    if (this.data === undefined)
     return []
    return [...new Set(this.data.features.map((feature) => feature.properties['friedhof']))]
  }

  friedhofCoordinates (friedhof: string) : number[] {
    if (this.data === undefined)
      return []
    return this.data.features.filter(feature => feature.properties['friedhof'] === friedhof)
      .map((feature) => feature.geometry['coordinates'])[0]
  }

  changeGrab (eventTarget: EventTarget | null) {
    let selectedFriedhof = this.friedhofs[0]
    if (eventTarget != null) {
      const selectEvent = eventTarget as HTMLInputElement
      selectedFriedhof = selectEvent.value
      console.log(selectEvent.value)
    }
    if (this.data != undefined) {
      const geoJSON = new GeoJSON().readFeatures(this.data)
      const friedhofFeatures = geoJSON.filter(feature => feature.getProperties()['friedhof'] === selectedFriedhof)
      const geometory = friedhofFeatures[0].getGeometry()
      if (geometory != undefined) {
        const extent = geometory.getExtent()
        const center = getCenter(extent)
        this.map.setView( new View({
          center: [center[0] , center[1]],
          zoom: 19
        }))
      }
    }
  }

  ngOnInit(): void {
    // Task 1
    // 1. How many graveyards are provided by the API?
    this.graveyardDataService.AllGraveyards().subscribe(graveyardsData => {
      console.log('1. How many graveyards are provided by the API?')
      console.log(graveyardsData.length)
      this.numberOfGraveyards = graveyardsData.length
    })
    // 2. How many graves are located in the graveyard named "Buschhoven"?
    this.graveyardDataService.AllAvailableGraveyards(null).subscribe(graveyardsData => {
      console.log('2. How many graves are located in the graveyard named "Buschhoven"?')
      const features = graveyardsData.features.filter(feature => feature.properties['friedhof'] === 'Buschhoven')
      console.log(features.length)
      this.numberOfGravesInBuschhoven = features.length
    })
    // 3. Which information/properties can be attached to a grave plot?
    this.graveyardDataService.AllunassignedGravePlots().subscribe(graveyardsData => {
      console.log('3. Which information/properties can be attached to a grave plot?')
      this.gravePlotFields = [...graveyardsData.features.map(feature => new Set(Object.keys(feature.properties))).reduce((left, right) => new Set([...left, ...right]))]
      console.log(this.gravePlotFields)
    })
    // 4. Which graveyard has the most unassigned grave plots?
    this.graveyardDataService.AllunassignedGravePlots().subscribe(gravePlotsData => {
      console.log('4. Which graveyard has the most unassigned grave plots?')
      const gravePlotsByGraveyardMap = new Map<string, number>()
      gravePlotsData.features.forEach(feature => {
        if (gravePlotsByGraveyardMap.has(feature.properties['friedhof'])) {
          gravePlotsByGraveyardMap.set(
            feature.properties['friedhof'],
            1 + gravePlotsByGraveyardMap.get(feature.properties['friedhof'])
          )
        } else {
          gravePlotsByGraveyardMap.set(feature.properties['friedhof'], 1)
        }
      })
      this.graveyardWithMostUnassigned = [...gravePlotsByGraveyardMap.entries()].reduce((left, right ) => right[1] > left[1] ? right : left)
      console.log(this.graveyardWithMostUnassigned)
    })
    // Task 2
    this.graveyardDataService.AllAvailableGraveyards(null).subscribe((data: FeatureCollection) => {

      console.log(data)
      this.data = data
      const styles = {
        'Verstorbene': new Style({
          stroke: new Stroke({
            color: 'green',
            lineDash: [4],
            width: 3,
          }),
          fill: new Fill({
            color: 'rgba(0, 255, 0, 0.1)',
          }),
        }),
        'Nutzungsfristende': new Style({
          stroke: new Stroke({
            color: 'red',
            lineDash: [4],
            width: 3,
          }),
          fill: new Fill({
            color: 'rgba(255, 0, 0, 0.1)',
          }),
        }),
        'Other': new Style({
          stroke: new Stroke({
            color: 'blue',
            lineDash: [4],
            width: 3,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.1)',
          }),
        }),
      }

      const styleFunction = function (feature: any) : Style {
        const today = Date.now()
        const d = feature.getProperties()['nutzungsfristende']
        if (d != undefined) {
          const Nutzungsfristende = Date.parse(d)
          if (today - Nutzungsfristende < 0) {
            return styles['Nutzungsfristende']
          }
        }
        if (feature.getProperties()['verstorbene'] != null) {
          return styles['Verstorbene']
        }
        return styles['Other']
      }
      
      const geoJsonData = new GeoJSON(/* {
        dataProjection: 'EPSG:25832',
        featureProjection: 'EPSG:25832'
      } */).readFeatures(data)

      const vectorSource = new VectorSource({
        features: geoJsonData,
      })

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: styleFunction,
      })

      this.map = new OlMap({
        view: new View({
          center: [0, 0],
          zoom: 1,
          // projection: 'EPSG:25832'
        }),
        layers: [
          new TileLayer({
            source: new OSM()
          }),
          vectorLayer,
        ],
        target: 'ol-map'
      })

      this.changeGrab(null)
    })
  }
}
