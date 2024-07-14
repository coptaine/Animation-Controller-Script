import { system, world } from "@minecraft/server"

let savedStates = {}

const stateMachinesHandler = (target, controllerName) => {
  const stateMachines = {
    superJumpController: {
      defaultState: "default",
      states: {
        default: {
          onEntry: () => {},
          onExit: () => {},
          transitions: [
            { sneak: target.isSneaking },
            { jump: target.isJumping }
          ]
        },
        sneak: {
          onEntry: () => {
            target.sendMessage("I'm sneaking!")
            target.addEffect("instant_health", 20)
          },
          onExit: () => {
            target.sendMessage("I'm not sneaking anymore!")
          },
          transitions: [
            { default: !target.isSneaking }
          ]
        },
        jump: {
          onEntry: () => {
            target.sendMessage("I jumped!")
          },
          onExit: () => {
            target.sendMessage("I landed!")
          },
          transitions: [
            { default: target.isOnGround }
          ]
        }
      }
    }
  }
  return stateMachines[controllerName]
}

export class StateMachine {
  /**
 * Executes the animation controller
 *
 * @param {string} target - The target entity.
 * @param {string} ControllerName - The name of the animation controller to run.
 */
  static run(target, controllerName) {
    const controller = stateMachinesHandler(target, controllerName)
    const states = Object.entries(controller.states)
    const controllerId = `${controllerName}_${target.id}`
    for (const [stateName, stateValue] of states) {
      if (!savedStates[controllerId]?.currentState) {
        savedStates[controllerId] = { currentState: controller.defaultState, executed: false }
      }
      const currentState = savedStates[controllerId].currentState
      if (currentState != stateName) continue
      let executed = false
      for (const transition of Object.entries(stateValue.transitions)) {
        if (Object.values(transition[1]).includes(true) && !executed) {
          const nextState = Object.keys(transition[1])[0]
          stateValue.onExit()
          controller.states[nextState].onEntry()
          savedStates[controllerId].currentState = nextState
          savedStates[controllerId].executed = true
          break
        }
      }
    }
  }
}

export const savedStatesCleaner = world.afterEvents.entityRemove.subscribe((event) => {
  const id = event.removedEntityId
  for (controllerId in savedStates) {
    if (controllerId.includes(id)) {
      delete savedStates[controllerId]
    }
  }
})