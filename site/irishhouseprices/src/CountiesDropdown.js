import React, { Component } from 'react';
import { Dropdown } from 'react-bootstrap'
  
export default class CountiesDropdown extends Component {
    
    constructor(props, context) {
        super(props, context);
        let selected = this.getSelectedCountiesFromProps(props)
        this.state = {  selected: selected, 
                        title: this.getTitle(selected) };
    }

    componentDidUpdate(prevProps, prevState) {
      // Naive enough but does the job for resetting
      if (this.props.selectedCounties.length !== prevProps.selectedCounties.length) {
        let selected = this.getSelectedCountiesFromProps(this.props)
        this.setState({selected: selected, 
                    title: this.getTitle(selected)})
      }
    }

    getSelectedCountiesFromProps = (props) => {
      let selected = {}
        // Set up selected counties
        if (props.selectedCounties && props.counties) {
          props.selectedCounties.forEach(county => {
            selected[county.id] = county
          })
        }
        return selected
    }
    
    onCountySelected = (e) => {
      const county = this.props.counties[e]
      const selected = this.state.selected
      const found = selected[county.id]
      if (found) {
          delete selected[county.id]
      } else {
          selected[county.id] = county
      }
      const selectedCounties = Object.values(selected)
      this.props.onCountiesSelected(selectedCounties)
      console.log(JSON.stringify(selected))
      this.setState({ selected: selected, title: this.getTitle(selected)})
    }

    outputCounties = () => {
        return this.props.counties.map((county, index) => {
            if (this.state.selected[county.id])  {
                return <Dropdown.Item key={index} eventKey={index} id={index} active as="button">{county.name}</Dropdown.Item>
            } 
            return <Dropdown.Item key={index} eventKey={index} id={index} as="button">{county.name}</Dropdown.Item>
          })
    }

    getTitle = (selected) => {
      const counties = selected
      if (Object.keys(counties).length === 0) {
        return "Select"
      }
      return Object.values(counties).map(county => county.name).join(", ")
    }

    render() {
      return (
        <Dropdown onSelect={this.onCountySelected} >
          <Dropdown.Toggle variant="primary" id="dropdown-item-button" className="justify-content-end">
            {this.state.title}
          </Dropdown.Toggle>

          <Dropdown.Menu>
                {this.outputCounties()} 
            </Dropdown.Menu>
        </Dropdown>
           
      );
    }
}