import { world } from "@minecraft/server"

let savedStates = {}

const stateMachinesHandler = (target, controllerName) => {
  //  --- Add your animation controllers here. States should always have onEntry, onExit and transitions. --- //
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
            target.addEffect("regeneration", 20)
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
            target.dimension.spawnEntity("fireworks_rocket", target.location)
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
      if (!savedStates[controllerId]) {
        savedStates[controllerId] = {
          currentState: controller.defaultState,
          hasEntered: false
        }
      }
      const currentState = savedStates[controllerId].currentState
      if (currentState != state) continue
      if (!savedStates[controllerId].hasEntered) {
        controller.states[state].onEntry()
        savedStates[controllerId].hasEntered = true
      }
      for (const transition of controller.states[state].transitions) {
        if (Object.values(transition).includes(true)) {
          const nextState = Object.keys(transition)
          controller.states[state].onExit()
          savedStates[controllerId].currentState = nextState
          savedStates[controllerId].hasEntered = false
          break
        }
      }
    }
  }
}

export const savedStatesCleaner = world.afterEvents.entityRemove.subscribe((event) => {
  const { id } = event.removedEntityId
  for (const controllerId in savedStates) {
    if (controllerId.includes(id)) {
      delete savedStates[controllerId]
    }
  }
})