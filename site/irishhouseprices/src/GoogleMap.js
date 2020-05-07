import React, { Component } from 'react'
import MarkerClusterer from '@google/markerclusterer'
import moment from 'moment'
import * as Price from './Price'

class GoogleMap extends Component {
  googleMapRef = React.createRef()
  googleMapScript = null
  markerCluster = null
  propertyLoader = null

  componentDidMount() {
    this.googleMapScript = document.createElement('script')
    this.googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD8wjrz1o5dUQhyxJUTTNyvPtrox-yuuE0&libraries=places,drawing`
    window.document.body.appendChild(this.googleMapScript)

    this.googleMapScript.addEventListener('load', this.loadMap)
  }

  shouldComponentUpdate(newProps) {
    if (this.props.markers == null || newProps.markers == null) return true
    if (this.props.markers.length !== newProps.markers.length) return true
    return false
  }

  componentDidUpdate() {
      this.loadMarkers()
  }

  loadMap = () => {
    this.googleMap = new window.google.maps.Map(this.googleMapRef.current, {
        zoom: 8,
        center: {
            lat: 53.0847767,
            lng: -8.4956548,
        },
        disableDefaultUI: true,
        gestureHandling: "greedy"
    })
    this.loadMarkers()
  }

  loadMarkers = () => {
    if (!this.props.propertyLoader) return
    if (!this.props.markers) return
    if (!this.props.properties) return
    if (!this.googleMap) return

      var options = {
          imagePath: '/assets/m'
      };

      let propertyLoader = this.props.propertyLoader
      let infowindow = new window.google.maps.InfoWindow({
          content: "<div><h1>PPR</h1></div>"
      });

      if (this.markerCluster != null) {
        this.markerCluster.clearMarkers()
      }

      let markers = new Array(this.props.markers.length)
      let propertyLoadFunctor = function(property) {
        let saleText = property.sales.map((value, index) => {
          return `
            <tr>
              <td align="left">${moment(value.date).format('Do MMMM YYYY')}</td>
              <td align="left"><strong>€${Price.formatMoney(parseInt(value.price))}</strong></td>
            </tr>`
          })
          let extraContent = '<br>'
          if (!localStorage.getItem('seen-disclaimer')) {
            extraContent = `
            <br>
            <p>Note: All data has been sourced from the Property Price Register of Ireland.</p>
            <p>This data is not always reliable.</p>
            <p>See <a href="https://medium.com/@parrotbait/the-property-price-register-a-rant-f55ca421e798" target="_blank" rel="noopener noreferrer">here</a> for more info of the flaws.</p>
            `
            localStorage.setItem('seen-disclaimer', 'true')
          }
        infowindow.setContent(`
          <div class="container-fluid">
            <h4>${property.address}</h4>
            <table width="95%">
              <tr>
                <th align="left">Date</th><th align="left">Price</th>
              </tr>
              ${saleText.join("")}
            </table>
            ${extraContent}
          </div>
        `)
      }
      for (let i = 0; i < this.props.markers.length; ++i) {
          let marker = this.props.markers[i]
          let gmapMarker = new window.google.maps.Marker({
              position: { lat: marker.latitude, lng: marker.longitude },
              map: this.googleMap,
            })
          markers[i] = gmapMarker
          let id_to_load =  marker.id
          gmapMarker.addListener('click', function() {
            infowindow.setContent(`Loading...`)
            infowindow.open(this.googleMap, gmapMarker);
            let center = new window.google.maps.LatLng(marker.latitude, marker.lotitude)
            gmapMarker.map.setCenter(center)
            if (propertyLoader) {
              //console.log("laoding " + id_to_load)
              propertyLoader(id_to_load, propertyLoadFunctor)
            }
          });
      }
      
      this.markerCluster = new MarkerClusterer(this.googleMap, markers, options)
  }

  createMarker = () => {
    new window.google.maps.Marker({
      position: { lat: 53.3498, lng: -6.2603 },
      map: this.googleMap,
    })
  }

  render() {
    return (
      <div
        id="google-map"
        ref={this.googleMapRef}
        style={{ width: '100%', height: '1000px' }}
      />
    )
  }
}

export default GoogleMap