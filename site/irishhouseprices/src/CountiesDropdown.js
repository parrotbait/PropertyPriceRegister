import React, { Component } from 'react';
import { Dropdown, FormControl } from 'react-bootstrap'

class CustomToggle extends React.Component {
    constructor(props, context) {
      super(props, context);
  
      this.handleClick = this.handleClick.bind(this);
    }
  
    handleClick(e) {
      e.preventDefault();
  
      this.props.onClick(e);
    }
  
    render() {
      return (
        <a href="" onClick={this.handleClick}>
          {this.props.children}
        </a>
      );
    }
  }
  
  class CustomMenu extends React.Component {
    constructor(props, context) {
      super(props, context);
  
      this.handleChange = this.handleChange.bind(this);
  
      this.state = { value: '' };
    }
  
    handleChange(e) {
      this.setState({ value: e.target.value.toLowerCase().trim() });
    }
  
    render() {
      const {
        children,
        style,
        className,
        'aria-labelledby': labeledBy,
      } = this.props;
  
      const { value } = this.state;
  
      return (
        <div style={style} className={className} aria-labelledby={labeledBy}>
          <FormControl
            autoFocus
            className="mx-3 my-2 w-auto"
            placeholder="Type to filter..."
            onChange={this.handleChange}
            value={value}
          />
          <ul className="list-unstyled">
            {React.Children.toArray(children).filter(
              child =>
                !value || child.props.children.toLowerCase().startsWith(value),
            )}
          </ul>
        </div>
      );
    }
  }
  
export default class CountiesDropdown extends Component {
    
    constructor(props, context) {
        super(props, context);
        this.state = { selected: [] };
    }
    
    onCountySelected = (e) => {
        let county = this.props.counties[e]
        let selected = this.state.selected
        let index = selected.indexOf(county.id)
        if (index !== -1) {
            selected.splice(index, 1);
        } else {
            selected.push(county.id)
        }
        let selectedCounties = this.props.counties.filter(x => selected.indexOf(x.id) !== -1)
        this.props.onCountiesSelected(selectedCounties)
    }

    state = {
      };
  
    outputCounties = () => {
        return this.props.counties.map((county, index) => {
            if (this.state.selected.indexOf(county.id) !== -1)  {
                return <Dropdown.Item key={index} eventKey={index} id={index} active>{county.name}</Dropdown.Item>
            } 
            return <Dropdown.Item key={index} eventKey={index} id={index}>{county.name}</Dropdown.Item>
          })
    }
    render() {
    return (
        <Dropdown onSelect={this.onCountySelected}>
            <Dropdown.Toggle as={CustomToggle} id="dropdown-custom-components">
                Click to change
            </Dropdown.Toggle>

            <Dropdown.Menu as={CustomMenu} onSelect={function(e){alert(e);}}>
                {this.outputCounties()} 
            </Dropdown.Menu>
        </Dropdown>
      );
    }
}