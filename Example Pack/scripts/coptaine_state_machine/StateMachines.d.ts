import { Entity } from "@minecraft/server"

/**
 * @remarks A class for handling state machines.
 * @example
 * const DoubleJump = new StateMachines(actor => {
    return {
        states: {
            "default": {
                transitions: [
                    { "jump": !actor.isSneaking && actor.isJumping }
                ]
            },
            "jump": {
                transitions: [
                    { "default": actor.isOnGround },
                    { "doubleJumpInit": !actor.isJumping && !actor.isOnGround }
                ]
            },
            "doubleJumpInit": {
                transitions: [
                    { "default": actor.isOnGround },
                    { "doubleJump": actor.isJumping && !actor.isOnGround }
                ],
                onExit: () => actor.doubleJumpTick = system.currenTick
            },
            "doubleJump": {
                onEntry: () => {
                    actor.applyKnockback(actor.location.x, actor.location.z, 0, 0.75)
                    actor.dimension.spawnParticle("minecraft:egg_destroy_emitter", actor.location)
                },
                transitions: [
                    { "default": actor.isOnGround }
                ]
            }
        }
    }
})
*/
export declare class StateMachines {
	/**
	 * Activates the state machine, causing it to execute every tick.
	 * @param {string | Entity} actor - The entity instance or entity identifier to apply the state machine to.
	 * @remarks
	 * - If a string (entity identifier) is provided, the state machine will be applied to all entities of that type.
	 * - If an `Entity` instance is provided, only that specific entity will be affected.
	 */
	activate(actor: string | Entity): void

    /**
	 * Deactivates the state machine.
	 */
    deactivate(): void
}