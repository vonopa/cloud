###
FrameTitleBar - title bar in a frame, in the frame tree
###

{debounce} = require('underscore')
{ButtonGroup, Button}   = require('react-bootstrap')
{React, rclass, rtypes, redux} = require('../smc-react')
{Icon, Space, Tip, VisibleMDLG,
 EditorFileInfoDropdown}= require('../r_misc')
{UncommittedChanges}    = require('../jupyter/uncommitted-changes')

{IS_TOUCH, IS_IPAD} = require('../feature')
misc       = require('smc-util/misc')

title_bar_style =
    background    : '#ddd'
    borderTop     : '1px solid rgb(204,204,204)'
    borderLeft    : '1px solid rgb(204,204,204)'
    borderRight   : '1px solid rgb(204,204,204)'
    padding       : '1px'
    #overflow      : 'hidden'

path_style =
    whiteSpace   : 'nowrap'
    fontSize     : '13px'
    paddingRight : '15px'
    color        : '#333'
    float        : 'right'

button_size = 'small'
if IS_TOUCH
    close_style = undefined
else
    close_style =
        background  : 'transparent'
        borderColor : 'transparent'

exports.FrameTitleBar = rclass
    propTypes :
        actions    : rtypes.object.isRequired
        active_id  : rtypes.string
        id         : rtypes.string
        path       : rtypes.string
        project_id : rtypes.string
        deletable  : rtypes.bool
        read_only  : rtypes.bool
        has_unsaved_changes : rtypes.bool
        is_full    : rtypes.bool
        is_only    : rtypes.bool    # is the only frame

    shouldComponentUpdate: (next) ->
        return @props.active_id  != next.active_id or \
               @props.id         != next.id or \
               @props.project_id != next.project_id or \
               @props.path       != next.path or \
               @props.deletable  != next.deletable or \
               @props.is_full    != next.is_full or \
               @props.is_only    != next.is_only or \
               @props.read_only  != next.read_only or \
               @props.has_unsaved_changes != next.has_unsaved_changes

    componentWillReceiveProps: ->
        @_last_render = new Date()

    click_close: ->
        if new Date() - @_last_render < 500
            # avoid accidental click -- easily can happen otherwise.
            return
        @props.actions.close_frame(@props.id)

    button_size: ->
        if @props.is_only or @props.is_full
            return
        else
            return 'small'

    render_x: ->
        show_full = @props.is_full or @props.active_id == @props.id
        <Button
            title    = {'Close this frame'}
            style    = {if not show_full then close_style}
            key      = {'close'}
            bsSize   = {@button_size()}
            onClick  = {@click_close} >
            <Icon name={'times'}/>
        </Button>

    render_control: ->
        is_active = @props.active_id == @props.id
        <ButtonGroup style={float:'right'} key={'close'}>
            {@render_split_row() if is_active and not @props.is_full}
            {@render_split_col() if is_active and not @props.is_full}
            {@render_full()      if is_active and not @props.is_only}
            {@render_x()         if not @props.is_only}
        </ButtonGroup>

    render_full: ->
        if @props.is_full
            <Button
                disabled = {@props.is_only}
                title   = {'Show all frames'}
                key     = {'compress'}
                bsSize  = {@button_size()}
                onClick = {=> @props.actions.set_frame_full()} >
                <Icon name={'compress'}/>
            </Button>
        else
            <Button
                disabled = {@props.is_only}
                key     = {'expand'}
                title   = {'Show only this frame'}
                bsSize  = {@button_size()}
                onClick = {=> @props.actions.set_frame_full(@props.id)} >
                <Icon name={'expand'}/>
            </Button>

    render_split_row: ->
        <Button
            key      = {'split-row'}
            title    = {'Split frame horizontally into two rows'}
            bsSize   = {@button_size()}
            onClick  = {=>if @props.is_full then @props.actions.set_frame_full() else @props.actions.split_frame('row', @props.id)} >
            <Icon name='columns' rotate={'90'} />
        </Button>

    render_split_col: ->
        <Button
            key      = {'split-col'}
            title    = {'Split frame vertically into two columns'}
            bsSize   = {@button_size()}
            onClick  = {=>if @props.is_full then @props.actions.set_frame_full() else @props.actions.split_frame('col', @props.id)} >
            <Icon name='columns' />
        </Button>

    render_zoom_out: ->
        <Button
            key     = {'font-increase'}
            title    = {'Decrease font size'}
            bsSize  = {@button_size()}
            onClick = {=>@props.actions.decrease_font_size(@props.id)}
            >
            <Icon style={fontSize:'5pt'} name={'font'} />
        </Button>

    render_zoom_in: ->
        <Button
            key     = {'font-decrease'}
            title    = {'Increase font size'}
            onClick = {=>@props.actions.increase_font_size(@props.id)}
            bsSize  = {@button_size()}
            >
            <Icon style={fontSize:'9pt'} name={'font'} />
        </Button>

    render_find_replace_group: ->
        <ButtonGroup key={'find-group'}>
            <Button
                key      = {'find'}
                title    = {'Find text'}
                onClick  = {=>@props.actions.find(@props.id)}
                bsSize   = {@button_size()}>
                <Icon name='search' />
            </Button>
            <Button
                key      = {'replace'}
                title    = {'Replace text'}
                onClick  = {=>@props.actions.replace(@props.id)}
                disabled = {@props.read_only}
                bsSize   = {@button_size()}>
                <Icon name='exchange' />
            </Button>
            <Button
                key      = {'goto-line'}
                title    = {'Jump to line'}
                onClick  = {=>@props.actions.goto_line(@props.id)}
                bsSize   = {@button_size()}>
                <Icon name='bolt' />
            </Button>
        </ButtonGroup>

    render_copy_group: ->
        <ButtonGroup key={'copy'}>
            <Button
                key      = {'cut'}
                title    = {'Cut selected text'}
                onClick  = {=>@props.actions.cut(@props.id)}
                disabled = {@props.read_only}
                bsSize   = {@button_size()}>
                <Icon name={'scissors'} />
            </Button>
            <Button
                key      = {'copy'}
                title    = {'Copy selected text'}
                onClick  = {=>@props.actions.copy(@props.id)}
                bsSize  = {@button_size()}>
                <Icon name={'copy'} />
            </Button>
            <Button
                key     = {'paste'}
                title    = {'Paste buffer'}
                onClick = {debounce((=>@props.actions.paste(@props.id)), 200, true)}
                disabled = {@props.read_only}
                bsSize  = {@button_size()}>
                <Icon name={'paste'} />
            </Button>
        </ButtonGroup>

    render_zoom_group: ->
        <ButtonGroup key={'zoom'}>
            {@render_zoom_out()}
            {@render_zoom_in()}
        </ButtonGroup>

    render_split_group: ->
        <ButtonGroup  key={'split'}>
            {@render_split_row()}
            {@render_split_col()}
        </ButtonGroup>

    render_undo_redo_group: ->
        <ButtonGroup key={'undo-group'}>
            <Button
                key      = {'undo'}
                title    = {'Undo last thing you did'}
                onClick  = {@props.actions.undo}
                disabled = {@props.read_only}
                bsSize   = {@button_size()}
                >
                <Icon name='undo' />
            </Button>
            <Button
                key      = {'redo'}
                title    = {'Redo last thing you did'}
                onClick  = {@props.actions.redo}
                disabled = {@props.read_only}
                bsSize   = {@button_size()}
                >
                <Icon name='repeat' />
            </Button>
        </ButtonGroup>


    render_save_timetravel_group: ->
        disabled = not @props.has_unsaved_changes or @props.read_only
        labels   = @props.is_only or @props.is_full
        <ButtonGroup key={'save-group'}>
            <Button
                key      = {'save'}
                title    = {"Save file to disk"}
                bsStyle  = {'success'}
                bsSize   = {@button_size()}
                disabled = {disabled}
                onClick  = {=>@props.actions.save(true)} >
                <Icon name='save' /> <VisibleMDLG>{if @props.read_only then 'Readonly' else if labels then 'Save' else ''}</VisibleMDLG>
                {<UncommittedChanges has_uncommitted_changes={@props.has_uncommitted_changes} delay_ms={8000} /> if not disabled}
            </Button>
            <Button
                key     = {'timetravel'}
                title   = {'Show complete edit history'}
                bsStyle = {'info'}
                bsSize  = {@button_size()}
                onClick = {@props.actions.time_travel} >
                <Icon name='history' />
                {if labels then 'TimeTravel'}
            </Button>
        </ButtonGroup>

    render_print_spinner: ->
        if @props.printing
            <span>
                <Space />
                <Spinner />
            </span>

    render_print: ->
        <Tip
            placement = {'left'}
            title     = {'Print file to PDF.'}>
            <Button
                bsSize   = {@button_size()}
                key      = {'print'}
                onClick  = {@props.actions.print}
                disabled = {@props.read_only} >
                <Icon name={'print'} />
                {@render_print_spinner()}
            </Button>
        </Tip>

    render_file_menu: ->
        <EditorFileInfoDropdown
            key       = {'info'}
            title     = {'File related actions'}
            filename  = {@props.path}
            actions   = {redux.getProjectActions(@props.project_id)}
            is_public = {false}
            label     = {if @props.is_only or @props.is_full then 'File'}
            bsSize    = {@button_size()}
        />

    render_buttons: ->
        if not (@props.is_only or @props.is_full)
            # When in split view, we let the buttonbar flow around and hide, so that
            # extra buttons are cleanly not visible when frame is thin.
            style = {maxHeight:'30px', overflow:'hidden', flex:1}
        else
            style = undefined
        <div
            style = {style}
            key   = {'buttons'}>
            {@render_save_timetravel_group()}
            {<Space/>}
            {@render_copy_group()}
            {<Space/>}
            {@render_undo_redo_group()}
            {<Space />}
            {@render_zoom_group()}
            {<Space />}
            {@render_find_replace_group()}
        </div>

    render_path: ->
        <span style={path_style}>
            <Tip
                placement = {'bottom'}
                title     = {@props.path}
            >
                {misc.path_split(@props.path).tail}
            </Tip>
        </span>

    render_main_buttons: ->
        # This is complicated below (with the flex display) in order to have a drop down menu that actually appears
        # and *ALSO* have buttons that vanish when there are many of them (via scrolling around).
        <div style={display:'flex'}>
            {@render_file_menu()}
            {@render_buttons()}
        </div>

    render: ->
        # Whether this is *the* active currently focused frame:
        is_active = @props.id == @props.active_id
        if is_active
            style = misc.copy(title_bar_style)
            style.background = '#f8f8f8'
        else
            style = title_bar_style

        <div style = {style}>
            {@render_control()}
            {if is_active then @render_main_buttons()}
        </div>