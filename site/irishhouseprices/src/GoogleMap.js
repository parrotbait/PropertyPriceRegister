import React, { Component, createRef } from 'react'
import MarkerClusterer from '@google/markerclusterer'
import moment from 'moment'
import * as Price from './Price'

class GoogleMap extends Component {
  googleMapRef = React.createRef()
  googleMapScript = null
  markerCluster = null

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
    })
    this.loadMarkers()
  }

  loadMarkers = () => {
    if (this.props.markers != null && 
        this.props.properties != null && 
        this.googleMap != null) {
        var options = {
            imagePath: '/assets/m'
        };

        console.log(this.props.markers.length + " markers found")
        var infowindow = new window.google.maps.InfoWindow({
            content: "<div><h1>PPR</h1></div>"
        });

        if (this.markerCluster != null) {
          this.markerCluster.clearMarkers()
        }

        let markers = new Array(this.props.markers.length)
        for (let i = 0; i < this.props.markers.length; ++i) {
            let marker = this.props.markers[i]
            let gmapMarker = new window.google.maps.Marker({
                position: { lat: marker.latitude, lng: marker.longitude },
                map: this.googleMap,
              })
            markers[i] = gmapMarker
            let property =  this.props.properties[i]
            gmapMarker.addListener('click', function() {
                infowindow.setContent(`
                <div>
                <h2 id="firstHeading">` + property.address+ `</h2>
                <div>
                <div id="bodyContent">
                  <table width="75%">
                    <tr>
                      <th align="left">Date</th><th align="left">Price</th>
                    </tr>
                ` +
                property.sales.map((value, index) => {
                  return `
                    <tr>
                        <td align="left">${moment(value.date).format('Do MMMM YYYY')}</td>
                        <td align="left"><strong>€` + Price.formatMoney(parseInt(value.price)) + `</strong></td>
                      </tr>
                      `
                  })
                  + `
                  </table>
                </div>
                <br>
                <p>Note: All data has been sourced from the Property Price Register of Ireland.</p>
                <p>This data is not always reliable.</p>
                <p>See <a href="https://medium.com/@parrotbait/the-property-price-register-a-rant-f55ca421e798" target="_blank" rel="noopener noreferrer">here</a> for more info of the flaws.</p>
                </div>
              </div>
                `)
                infowindow.open(this.googleMap, gmapMarker);
            });
        }
        
        this.markerCluster = new MarkerClusterer(this.googleMap, markers, options)
      }
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