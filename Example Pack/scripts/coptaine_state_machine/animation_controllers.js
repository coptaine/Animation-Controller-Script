import { world } from "@minecraft/server"

let savedStates = {}

const stateMachinesHandler = (target, controllerName) => {
  //  --- States should always have onEntry, onExit and transitions. --- //
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
    const controllerId = `${controllerName}_${target.id}`
    for (const state in controller.states) {
      if (!savedStates[controllerId]?.currentState) {
        savedStates[controllerId] = { currentState: controller.defaultState, executed: false }
      }
      const currentState = savedStates[controllerId].currentState
      if (currentState != state) continue
      let executed = false
      for (const transition of controller.states[state].transitions) {
        if (Object.values(transition).includes(true) && !executed) {
          const nextState = Object.keys(transition)
          controller.states[state].onExit()
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
  const { id, typeId } = event.removedEntityId
  if (typeId === "minecraft:player") return
  for (controllerId in savedStates) {
    if (controllerId.includes(id)) {
      delete savedStates[controllerId]
    }
  }
})