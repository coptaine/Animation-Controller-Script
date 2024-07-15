import { world } from "@minecraft/server"

let savedStates = {}

const stateMachinesHandler = (target, controllerName) => {
  const stateMachines = {
    /* 
    * Add your animation controllers here.
    * onEntry, onExit, transitions and loop can be omitted if not needed.
    * The loop property determines if the onEntry function should always run until the state exits.
    */
    doubleJumpController: {
      defaultState: "default",
      states: {
        default: {
          transitions: [
            { jump: target.isJumping }
          ]
        },
        jump: {
          transitions: [
            { default: target.isOnGround },
            { doubleJumpInit: !target.isJumping && !target.isOnGround }
          ]
        },
        doubleJumpInit: {
          transitions: [
            { default: target.isOnGround },
            { doubleJump: target.isJumping && !target.isOnGround }
          ]
        },
        doubleJump: {
          loop: false,
          onEntry: () => {
            target.applyKnockback(target.location.x, target.location.z, 0, 0.75)
            target.dimension.spawnParticle("minecraft:egg_destroy_emitter", target.location)
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
        if (typeof controller.states[state].onEntry === "function") controller.states[state].onEntry()
        if (!controller.states[state].loop) savedStates[controllerId].hasEntered = true
      }
      if (!controller.states[state].transitions) break
      for (const transition of controller.states[state].transitions) {
        if (Object.values(transition).includes(true)) {
          const nextState = Object.keys(transition)
          if (typeof controller.states[state].onExit === "function") controller.states[state].onExit()
          savedStates[controllerId].currentState = nextState
          savedStates[controllerId].hasEntered = false
          break
        }
      }
    }
  }
}

export const savedStatesCleaner = world.afterEvents.entityRemove.subscribe((event) => {
  const id = event.removedEntityId
  for (const controllerId in savedStates) {
    if (controllerId.includes(id)) {
      delete savedStates[controllerId]
    }
  }
})