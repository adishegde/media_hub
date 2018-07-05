/* Home screen page */
import React from "react";
import { withRouter } from "react-router";
import {
    Input,
    Grid,
    Segment,
    Select,
    Image,
    Button,
    Icon
} from "semantic-ui-react";
import Logo from "app/assets/Logo.png";

import SearchBar from "app/render/components/search";

class Home extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            search: "",
            param: "default",
            searching: false
        };

        this.onChange = this.onChange.bind(this);
        this.onSearch = this.onSearch.bind(this);
    }

    render() {
        let { search, param, searching } = this.state;

        return (
            <div className="home" style={{ height: "100%", width: "100%" }}>
                <Grid
                    textAlign="center"
                    style={{ height: "100%", width: "100%" }}
                    verticalAlign="middle"
                >
                    <Grid.Column style={{ maxWidth: "75%" }} stretched>
                        <Segment basic textAlign="center">
                            <Segment basic>
                                <Image src={Logo} size="medium" centered />
                            </Segment>
                            <SearchBar
                                search={search}
                                param={param}
                                loading={searching}
                                onChange={this.onChange}
                                onSearch={this.onSearch}
                            />
                        </Segment>
                    </Grid.Column>
                </Grid>
            </div>
        );
    }

    onChange(e, { name, value }) {
        // Ensure name of input tags is same as the state properties
        this.setState({
            [name]: value
        });
    }

    onSearch() {
        this.setState({
            searching: true
        });

        let { search, param } = this.state;

        // On search we route to the result page. The result page is
        // responsible for actually sending the search requests.
        // We send the search and param values through location state.
        this.props.history.push("/results", { search, param });
    }
}

export default withRouter(Home);
