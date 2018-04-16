/*
Top-level react component for editing LaTeX documents
*/

import misc from "smc-util/misc";

import { React, rclass, rtypes } from "../smc-react";

import { FormatBar } from "../markdown-editor/format-bar";
import { Editor as BaseEditor, set } from "../code-editor/editor";

import { PDFJS } from "./pdfjs";
import { PDFEmbed } from "./pdf-embed";
import { LaTeXJS } from "./latexjs";
import { PEG } from "./peg";
import { CodemirrorEditor } from "../code-editor/codemirror-editor";
import { Build } from "./build";
import { ErrorsAndWarnings } from "./errors-and-warnings";

import {pdf_path} from "./util";

const EDITOR_SPEC = {
    cm: {
        short: "LaTeX",
        name: "LaTeX Source Code",
        icon: "code",
        component: CodemirrorEditor,
        buttons: set([
            "print",
            "decrease_font_size",
            "increase_font_size",
            "save",
            "time_travel",
            "replace",
            "find",
            "goto_line",
            "cut",
            "paste",
            "copy",
            "undo",
            "redo",
            "help"
        ]),
        gutters: ["Codemirror-latex-errors"]
    },

    pdfjs_svg: {
        short: "PDF (svg)",
        name: "PDF View - SVG",
        icon: "file-pdf-o",
        component: PDFJS,
        buttons: set([
            "print",
            "save",
            "reload",
            "decrease_font_size",
            "increase_font_size"
        ]),
        path: pdf_path,
        style: { background: "#525659" },
        renderer: "svg"
    },

    pdfjs_canvas: {
        short: "PDF (canvas)",
        name: "PDF View - Canvas",
        icon: "file-pdf-o",
        component: PDFJS,
        buttons: set([
            "print",
            "save",
            "reload",
            "decrease_font_size",
            "increase_font_size"
        ]),
        path: pdf_path,
        style: { background: "#525659" },
        renderer: "canvas"
    },

    error: {
        short: "Errors",
        name: "Errors and Warnings",
        icon: "bug",
        component: ErrorsAndWarnings,
        buttons: set(["reload", "decrease_font_size", "increase_font_size"])
    },

    build: {
        short: "Build",
        name: "Build Control",
        icon: "terminal",
        component: Build,
        buttons: set(["reload", "decrease_font_size", "increase_font_size"])
    },

    embed: {
        short: "PDF (native)",
        name: "PDF View - Native",
        icon: "file-pdf-o",
        buttons: set(["print", "save", "reload"]),
        component: PDFEmbed,
        path: pdf_path
    },

    latexjs: {
        short: "Preview 1",
        name: "Rough Preview  1 - LaTeX.js",
        icon: "file-pdf-o",
        component: LaTeXJS,
        buttons: set([
            "print",
            "save",
            "decrease_font_size",
            "increase_font_size"
        ])
    },

    peg: {
        short: "Preview 2",
        name: "Rough Preview 2 - PEG.js",
        icon: "file-pdf-o",
        component: PEG,
        buttons: set([
            "print",
            "save",
            "decrease_font_size",
            "increase_font_size"
        ])
    }
};

let Editor = rclass(function({ name }) {
    return {
        displayName: "LaTeX-Editor",

        propTypes: {
            actions: rtypes.object.isRequired,
            path: rtypes.string.isRequired,
            project_id: rtypes.string.isRequired
        },

        reduxProps: {
            account: {
                editor_settings: rtypes.immutable
            },
            [name]: {
                is_public: rtypes.bool
            }
        }, // optional extra state of the format bar, stored in the Store

        shouldComponentUpdate(next) {
            if (!this.props.editor_settings) return false;
            return (
                this.props.editor_settings.get("extra_button_bar") !==
                next.editor_settings.get("extra_button_bar")
            );
        },

        render_format_bar() {
            if (
                !this.props.is_public &&
                this.props.editor_settings &&
                this.props.editor_settings.get("extra_button_bar")
            )
                return (
                    <FormatBar actions={this.props.actions} extension={"tex"} />
                );
        },

        render_editor() {
            return (
                <BaseEditor
                    name={name}
                    actions={this.props.actions}
                    path={this.props.path}
                    project_id={this.props.project_id}
                    editor_spec={EDITOR_SPEC}
                />
            );
        },

        render() {
            return (
                <div className="smc-vfill">
                    {this.render_format_bar()}
                    {this.render_editor()}
                </div>
            );
        }
    };
});

export { Editor };