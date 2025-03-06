import { world, system, Entity, DimensionTypes } from "@minecraft/server"

function generateUniqueKey() {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
	let key = ""
	for (let i = 0; i < 10; i++) {
		key += characters[Math.floor(Math.random() * characters.length)]
	}
	return "stateMachine_" + key
}

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
export class StateMachines {
	#Id
	#isActive
	constructor(controller) {
		this.controller = controller
		this.#isActive = true
		this.#generateId()
	}

	#generateId() {
		this.#Id = generateUniqueKey()
	}

	#run(actor, controller, persistent) {
		const states = controller.states
		let controllerId = persistent ? controller.toString() : this.#Id
		let actorState

		if (persistent) {
			const data = actor.getDynamicProperty(controllerId)

			if (data) {
				actorState = JSON.parse(data)
			} else {
				actorState = {
					currentState: Object.keys(controller.states)[0],
					isRunning: false
				}
				actor.setDynamicProperty(controllerId, JSON.stringify(actorState))
			}
		} else {
			if (!actor[controllerId]) {
				actorState = {
					currentState: Object.keys(controller.states)[0],
					isRunning: false
				}
			}
		}

		const currentState = controller.states[actorState.currentState]

		if (!actorState.isRunning) {
			if (typeof currentState.onEntry == "function") currentState.onEntry()
			actorState.isRunning = true
			actor.setDynamicProperty(controllerId, JSON.stringify(actorState))
			return
		}
		if (!currentState.transitions || !currentState.transitions.length) return

		for (const transition of currentState.transitions) {
			if (Object.values(transition).includes(true)) {
				const nextState = Object.keys(transition)
				if (typeof currentState.onExit == "function") currentState.onExit()
				if (typeof states[nextState].onEntry == "function") states[nextState].onEntry()
				actorState.currentState = nextState
				actor.setDynamicProperty(controllerId, JSON.stringify(actorState))
				return
			}
		}
	}

	/**
	 * Activates the state machine, causing it to execute every tick.
	 *
	 * @param {string | Entity} actor - The entity instance or entity identifier to apply the state machine to.
	 * @param {boolean} [persistent=false] - Whether the state persists after exiting the world.
	 *   
	 * @remarks
	 * - If a string (entity identifier) is provided, the state machine will be applied to all entities of that type.
	 * - If an `Entity` instance is provided, only that specific entity will be affected.
	 */
	activate(actor, persistent = false) {
		const newController = system.runInterval(() => {
			if (!this.#isActive) system.clearRun(newController)
			if (typeof actor != "string") return this.#run(actor, this.controller(actor), persistent)
			if (actor == "minecraft:player") {
				for (const player of world.getPlayers()) {
					this.#run(player, this.controller(player), persistent)
				}
				return
			}

			for (const dimension of DimensionTypes.getAll()) {
				for (const entity of world.getDimension(dimension.typeId).getEntities({ type: actor })) {
					this.#run(entity, this.controller(entity), persistent)
				}
			}
		}, 1)
	}

	/**
	 * Deactivates the state machine.
	 * @returns {void}
	 */
	deactivate() {
		this.#isActive = false
	}
}