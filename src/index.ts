import "regenerator-runtime/runtime"
import { createScClient, WellKnownChain } from "@substrate/connect"
import westmintSpecs from "./westend-westmint.json"
import UI from "./view"

interface UiElements {
  auth: HTMLElement | null
  spec: HTMLElement | null
  trans: HTMLElement | null
  newBlock: HTMLElement | null
  best: HTMLElement | null
  finalized: HTMLElement | null
}

const getStruct = (name: string): UiElements => ({
  auth: document.getElementById(name + "Auth"),
  spec: document.getElementById(name + "Spec"),
  trans: document.getElementById(name + "Trans"),
  newBlock: document.getElementById(name + "New"),
  best: document.getElementById(name + "Best"),
  finalized: document.getElementById(name + "Finalized"),
})

window.onload = () => {
  const loadTime = performance.now()
  const ui = new UI({ containerId: "messages" }, { loadTime })
  ui.showSyncing()

  const west = getStruct("westend")
  const westmint = getStruct("westmint")
  
  const showStuffInUI = (who: UiElements, what: string) => {
    const json = JSON.parse(what)
    switch (json.event) {
      case "initialized":
        if (who.auth)
          who.auth.innerText = JSON.stringify(
            json.finalizedBlockRuntime.spec.authoringVersion,
          )
        if (who.spec)
          who.spec.innerText = JSON.stringify(
            json.finalizedBlockRuntime.spec.specVersion,
          )
        if (who.trans)
          who.trans.innerText = JSON.stringify(
            json.finalizedBlockRuntime.spec.transactionVersion,
          )

        break
      case "newBlock":
        if (who.newBlock)
          who.newBlock.innerText = JSON.stringify(json.blockHash)
        break
      case "bestBlockChanged":
        if (who.best) who.best.innerText = JSON.stringify(json.bestBlockHash)
        break
      case "finalized":
        if (who.finalized) {
          who.finalized.innerText = JSON.stringify(
            json.finalizedBlockHashes.join(),
          )
        }
        break
    }
  }

  void (async () => {
    try {
      const scClient = createScClient()
      const westendChain = await scClient.addWellKnownChain(
        WellKnownChain.westend2,
        function jsonRpcCallback(response) {
          if (!(JSON.parse(response).params?.result)) {
            return
          }
          showStuffInUI(
            west,
            JSON.stringify(JSON.parse(response).params.result),
          )
        },
      )

      const westmintChain = await scClient.addChain(
        JSON.stringify(westmintSpecs),
        function jsonRpcCallback(response) {
          showStuffInUI(
            westmint,
            JSON.stringify(JSON.parse(response).params.result),
          )
        },
      )

      westendChain.sendJsonRpc(
        '{"jsonrpc":"2.0","id":"1","method":"chainHead_unstable_follow","params":[true]}',
      )
      westmintChain.sendJsonRpc(
        '{"jsonrpc":"2.0","id":"1","method":"chainHead_unstable_follow","params":[true]}',
      )
    } catch (error) {
      ui.error(error as Error)
    }
  })()
}
