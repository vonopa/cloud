/*
help users selecting a kernel
*/

import { React, Component, Rendered } from "../app-framework"; // TODO: this will move
import {
  Map as ImmutableMap,
  List,
  OrderedMap /*, List as ImmutableList*/
} from "immutable";
import * as misc from "smc-util/misc";
const { Icon, Loading } = require("../r_misc"); // TODO: import types
const {
  Button,
  Col,
  Row,
  ButtonGroup,
  Checkbox,
  Alert
} = require("react-bootstrap"); // TODO: import types
import { Kernel } from "./util";
const { COLORS } = require("smc-util/theme");

const row_style: React.CSSProperties = {
  marginTop: "5px",
  marginBottom: "5px"
};

const main_style: React.CSSProperties = {
  padding: "20px 10px",
  overflowY: "auto",
  overflowX: "hidden"
};

interface KernelSelectorProps {
  actions: any;
  site_name: string;
  kernel?: string;
  kernel_info?: any;
  default_kernel?: string;
  ask_jupyter_kernel?: boolean;
  kernel_selection?: ImmutableMap<string, string>;
  kernels_by_name?: OrderedMap<string, ImmutableMap<string, string>>;
  kernels_by_language?: OrderedMap<string, List<string>>;
  closestKernel?: Kernel;
}

interface KernelSelectorState {}

export class KernelSelector extends Component<
  KernelSelectorProps,
  KernelSelectorState
> {
  constructor(props: KernelSelectorProps, context: any) {
    super(props, context);
    this.state = {};
  }

  // the idea here is to not set the kernel, but still render the notebook.
  // looks like that's not easy, and well, probably incompatible with classical jupyter.

  /*
    <Row style={row_style} className={"pull-right"}>
      {this.close_button()}
    </Row>

  close_button() {
    return (
      <Button
        key={"close"}
        bsStyle={"default"}
        onClick={() => this.props.actions.select_kernel(null)}
      >
        {"View without kernel"}
      </Button>
    );
  }
  */

  kernel_name(name: string) {
    return this.kernel_attr(name, "display_name");
  }

  kernel_attr(name: string, attr: string): string {
    if (this.props.kernels_by_name == null) return "";
    const k = this.props.kernels_by_name.get(name);
    if (k == null) return "";
    return k.get(attr, name);
  }

  render_suggested_link(cocalc) {
    if (cocalc == null) return;
    const url: string | undefined = cocalc.get("url");
    const descr: string | undefined = cocalc.get("description", "");
    if (url != null) {
      return (
        <a href={url} target={"_blank"} rel={"noopener"}>
          {descr}
        </a>
      );
    } else {
      return descr;
    }
  }

  render_kernel_button(
    name: string,
    size?: string,
    show_icon: boolean = true
  ): Rendered {
    const lang = this.kernel_attr(name, "language");
    let icon: Rendered | undefined = undefined;
    if (lang != null && show_icon) {
      if (["python", "r", "sagemath", "octave", "julia"].indexOf(lang) >= 0) {
        icon = <Icon name={`cc-icon-${lang}`} />;
      } else if (lang.startsWith("bash")) {
        icon = <Icon name={"terminal"} />;
      }
      // TODO do other languages have icons?
    }
    return (
      <Button
        key={`kernel-${lang}-${name}`}
        onClick={() => this.props.actions.select_kernel(name)}
        bsSize={size}
        style={{ marginBottom: "5px" }}
      >
        {icon} {this.kernel_name(name)}
      </Button>
    );
  }

  render_suggested() {
    if (
      this.props.kernel_selection == null ||
      this.props.kernels_by_name == null
    )
      return;

    const entries: Rendered[] = [];
    this.props.kernel_selection
      .sort((a, b) => this.kernel_name(a).localeCompare(this.kernel_name(b)))
      .map((name, lang) => {
        const cocalc: ImmutableMap<
          string,
          any
        > = this.props.kernels_by_name!.getIn(
          [name, "metadata", "cocalc"],
          null
        );
        if (cocalc == null) return;
        const prio: number = cocalc.get("priority", 0);
        if (prio < 10) return;

        entries.push(
          <Row key={lang} style={row_style}>
            <Col sm={6}>{this.render_kernel_button(name)}</Col>
            <Col sm={6}>
              <div>{this.render_suggested_link(cocalc)}</div>
            </Col>
          </Row>
        );
      });

    if (entries.length == 0) return;

    return (
      <Row style={row_style}>
        <h4>Suggested kernels</h4>
        <Col>{entries}</Col>
      </Row>
    );
  }

  // render_all_selected_link() {
  //   if (this.props.kernels_by_name == null) return;
  //   const name = this.state.selected_kernel;
  //   if (name == null) return;
  //   const cocalc: ImmutableMap<string, any> = this.props.kernels_by_name.getIn(
  //     [name, "metadata", "cocalc"],
  //     null
  //   );
  //   return this.render_suggested_link(cocalc);
  // }

  render_all_langs(): Rendered[] | undefined {
    if (this.props.kernels_by_language == null) return;
    const label: React.CSSProperties = {
      fontWeight: "bold",
      color: COLORS.GRAY_D
    };
    const all: Rendered[] = [];
    this.props.kernels_by_language.forEach((names, lang) => {
      const kernels = names.map(name =>
        this.render_kernel_button(name, "small", false)
      );
      all.push(
        <Row key={lang} style={row_style}>
          <Col sm={2} style={label}>
            {misc.capitalize(lang)}
          </Col>
          <Col sm={10}>
            <ButtonGroup>{kernels}</ButtonGroup>
          </Col>
        </Row>
      );
      return true;
    });

    return all;
  }

  render_all() {
    if (this.props.kernels_by_language == null) return;

    return (
      <Row style={row_style}>
        <h4>All kernels by language</h4>
        <Col>{this.render_all_langs()}</Col>
      </Row>
    );
  }

  render_last() {
    if (this.props.default_kernel == null) return;
    return (
      <Row style={row_style}>
        <h4>Quick selection</h4>
        <div>
          Your most recently selected kernel is{" "}
          {this.render_kernel_button(this.props.default_kernel)}.
        </div>
      </Row>
    );
  }

  dont_ask_again_click(checked: boolean) {
    this.props.actions.kernel_dont_ask_again(checked);
  }

  render_dont_ask_again() {
    return (
      <Row style={row_style}>
        <div>
          <Checkbox
            checked={!this.props.ask_jupyter_kernel}
            onChange={e => this.dont_ask_again_click(e.target.checked)}
          >
            Do not ask again
          </Checkbox>
          <span style={{ color: COLORS.GRAY }}>
            Check this box to always use your most recent selection. You can
            change your kernel any time later, too.
          </span>
        </div>
      </Row>
    );
  }

  render_top() {
    if (this.props.kernel == null || this.props.kernel_info == null) {
      let msg: Rendered;
      // kernel, but no info means it is not known
      if (this.props.kernel != null && this.props.kernel_info == null) {
        msg = (
          <>
            Your notebook kernel <code>"{this.props.kernel}"</code> does not
            exist on {this.props.site_name}.
          </>
        );
      } else {
        msg = <>This notebook has no kernel.</>;
      }
      return (
        <Row style={row_style}>
          <strong>{msg}</strong> A working kernel is required in order to
          evaluate the code in the notebook. Please select one for the
          programming language you want to work with.
        </Row>
      );
    } else {
      return (
        <Row style={row_style}>
          <strong>Select a new kernel.</strong> The currently selected kernel is{" "}
          "{this.kernel_name(this.props.kernel)}".
        </Row>
      );
    }
  }

  render_unknown() {
    const closestKernel = this.props.closestKernel;
    if (this.props.kernel_info != null || closestKernel == null) return;
    const closestKernelName = closestKernel.get("name");
    if (closestKernelName == null) return;

    return (
      <Row style={row_style}>
        <Alert bsStyle={"danger"}>
          <h4>Unknown Kernel</h4>
          <div>
            A similar kernel might be{" "}
            {this.render_kernel_button(closestKernelName)}.
          </div>
        </Alert>
      </Row>
    );
  }

  render_footer(): Rendered {
    return (
      <Row style={{ ...row_style, ...{ color: COLORS.GRAY } }}>
        <strong>Note:</strong> You can always change the selected kernel later
        in the »Kernel« menu or by clicking on the kernel information at the top
        right.
      </Row>
    );
  }

  render_close_button(): Rendered | undefined {
    if (this.props.kernel == null || this.props.kernel_info == null) return;
    return (
      <Button
        style={{ float: "right" }}
        onClick={() => this.props.actions.hide_select_kernel()}
      >
        Close
      </Button>
    );
  }

  render_body(): Rendered {
    if (
      this.props.kernels_by_name == null ||
      this.props.kernel_selection == null
    ) {
      return (
        <Row style={row_style}>
          <Loading />
        </Row>
      );
    } else {
      return (
        <>
          {this.render_top()}
          {this.render_unknown()}
          {this.render_last()}
          {this.render_dont_ask_again()}
          {this.render_suggested()}
          {this.render_all()}
          <hr />
          {this.render_footer()}
        </>
      );
    }
  }

  render_head(): Rendered {
    return (
      <Row style={row_style}>
        <h3>
          {"Select a Kernel"}
          {this.render_close_button()}
        </h3>
      </Row>
    );
  }

  render(): Rendered {
    return (
      <div style={main_style} className={"smc-vfill"}>
        <Col md={8} mdOffset={2}>
          {this.render_head()}
          {this.render_body()}
        </Col>
      </div>
    );
  }
}
