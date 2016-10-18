import os from 'os'

import React from 'react'
import classNames from 'classnames'

const { ipcRenderer, shell } = window.require('electron')

import VersionStore from '../stores/VersionStore'
import CurrencyStore from '../stores/CurrencyStore'
import AppStore from '../stores/AppStore'

import AppDispatcher from '../dispatcher/Dispatcher'
import ActionTypes from '../constants/ActionTypes'
import Actions from '../actions/Actions'
import pkg from '../../package.json'

const platform = os.platform()

export default class Footer extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isUpdateAvailable: VersionStore.isUpdateAvailable(),
      version: VersionStore.getVersion(),
      currencies: CurrencyStore.getCurrencies(),
      selectedCurrency: CurrencyStore.getSelectedCurrency(),
      online: AppStore.isOnline()
    }

    this.quit = this.quit.bind(this)
    this.openGitHubLink = this.openGitHubLink.bind(this)
    this.onVersionChange = this.onVersionChange.bind(this)
    this.onCurrencyChange = this.onCurrencyChange.bind(this)
    this.setCurrency = this.setCurrency.bind(this)
    this.onAppStatusChange = this.onAppStatusChange.bind(this)
  }

  shouldComponentUpdate (nextProps, nextState) {
    return (
      this.state.isUpdateAvailable !== nextState.isUpdateAvailable ||
      this.state.version !== nextState.version ||
      this.state.currencies !== nextState.currencies ||
      this.state.selectedCurrency !== nextState.selectedCurrency ||
      this.state.online !== nextState.online
    )
  }

  componentDidMount () {
    Actions.checkForUpdate()
    VersionStore.addChangeListener(this.onVersionChange)
    CurrencyStore.addChangeListener(this.onCurrencyChange)
    AppStore.addChangeListener(this.onAppStatusChange)

    setInterval(Actions.fetchCurrencyData, 30000)
    setInterval(Actions.checkForUpdate, 2160000)
  }

  componentWillUnmount () {
    VersionStore.removeChangeListener(this.onVersionChange)
    CurrencyStore.removeChangeListener(this.onCurrencyChange)
    AppStore.removeChangeListener(this.onAppStatusChange)
  }

  onVersionChange () {
    this.setState({
      isUpdateAvailable: VersionStore.isUpdateAvailable(),
      version: VersionStore.getVersion()
    })
  }

  onCurrencyChange () {
    this.setState({
      currencies: CurrencyStore.getCurrencies(),
      selectedCurrency: CurrencyStore.getSelectedCurrency()
    })
  }

  onAppStatusChange () {
    this.setState({
      online: AppStore.isOnline()
    })
  }

  quit () {
    ipcRenderer.send('quit')
  }

  openGitHubLink () {
    if (this.state.isUpdateAvailable) shell.openExternal(`${pkg.repository}/releases/latest`)
    else shell.openExternal(pkg.repository)
  }

  setCurrency (currency) {
    return () => {
      if (this.state.selectedCurrency === currency) return

      AppDispatcher.dispatch({
        type: ActionTypes.SELECT_CURRENCY,
        data: {
          selected_currency: currency
        }
      })
    }
  }

  render () {
    console.log('Rendering footer')

    const { currencies, isUpdateAvailable, online, version } = this.state

    const currencyKeys = Object.keys(currencies)
    const currencyList = currencyKeys.map((currency) => {
      const currencyClass = classNames({
        'btn btn-default': true,
        'active': this.state.selectedCurrency === currency
      })

      return <button className={currencyClass} key={currency} onClick={this.setCurrency(currency)}>{currency}</button>
    })

    const updateTitle = isUpdateAvailable ? 'Update available. Click this button to download new version.' : version
    const onlineOfflineTitle = online ? 'Online' : 'Offline'
    const renderCloseButton = platform === 'darwin' || platform === 'win32'

    const updateClass = classNames({
      'btn btn-default': true,
      'update-available': this.state.isUpdateAvailable
    })

    const onlineOfflineClass = classNames({
      'icon icon-record': true,
      'online': online,
      'offline': !online
    })

    return (
      <footer className='toolbar toolbar-footer'>
        <div className='toolbar-actions'>
          <div className='btn-group'>
            <button className='btn btn-default' title={onlineOfflineTitle}>
              <span className={onlineOfflineClass} />
            </button>
            <button className={updateClass} onClick={this.openGitHubLink} title={updateTitle}>
              <span className='icon icon-github' />
            </button>
            {renderCloseButton ? <button className='btn btn-default' onClick={this.quit}>
              <span className='icon icon-cancel' />
            </button> : ''}
          </div>
          <div className='btn-group btn-group-currencies'>
            {currencyList}
          </div>
        </div>
      </footer>
    )
  }
}
