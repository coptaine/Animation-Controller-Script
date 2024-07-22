import { world, system } from "@minecraft/server"

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
            { jump: !target.isSneaking && target.isJumping }
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
    },
    superJumpController: { 
      defaultState: "default",
      states: {
        default: {
          onEntry: () => { 
            target.charged = 0
          },
          transitions: [
            { charge: target.isSneaking && target.isOnGround }
          ]
        },
        charge: {
          loop: true,
          onEntry: () => {
            target.charged++
            target.onScreenDisplay.setActionBar(`§7Jump Power: §a${(target.charged / 2).toFixed(2)}`)
          },
          transitions: [
            { default: !target.isSneaking },
            { superJump: target.isJumping }
          ]
        },
        superJump: {
          onEntry: () => {
            target.applyKnockback(target.location.x, target.location.z, 0, target.charged * 0.05)
            target.dimension.spawnParticle("minecraft:egg_destroy_emitter", target.location)
          },
          transitions: [
            { default: target.isOnGround }
          ]
        }
      }
    },
    elytraBoostController: {
      defaultState: "default",
      states: {
        default: {
          onEntry: () => {},
          transitions: [
            { boost: target.isGliding && target.isSneaking }
          ]
        },
        boost: {
          loop: true,
          onEntry: () => {
            target.applyKnockback(target.getViewDirection().x, target.getViewDirection().z, 1.0, target.getViewDirection().y * 2)
          },
          transitions: [
            { default: !target.isGliding || !target.isSneaking }
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
    if (!target[controllerId]) {
      target[controllerId] = {
        currentState: controller.defaultState,
        hasEntered: false
      }
    }
    for (const state in controller.states) {
      const currentState = target[controllerId].currentState
      if (currentState != state) continue
      if (!target[controllerId].hasEntered) {
        if (typeof controller.states[state].onEntry === "function") controller.states[state].onEntry()
        if (!controller.states[state].loop) target[controllerId].hasEntered = true
      }
      if (!controller.states[state].transitions) break
      for (const transition of controller.states[state].transitions) {
        if (Object.values(transition).includes(true)) {
          const nextState = Object.keys(transition)
          if (typeof controller.states[state].onExit === "function") controller.states[state].onExit()
          target[controllerId].currentState = nextState
          target[controllerId].hasEntered = false
          break
        }
      }
    }
  }
}