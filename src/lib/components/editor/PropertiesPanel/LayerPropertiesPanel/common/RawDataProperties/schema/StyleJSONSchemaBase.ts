export const getStyleJSONSchemaDefinition = (
	key: keyof (typeof StyleJSONSchemaBase)['definitions']
) => {
	return {
		...StyleJSONSchemaBase,
		$ref: `#/definitions/${key}`
	};
};

const StyleJSONSchemaBase = {
	$ref: '#/definitions/StyleSpecification',
	$schema: 'http://json-schema.org/draft-07/schema#',
	definitions: {
		BBox: {
			anyOf: [
				{
					items: {
						type: 'number'
					},
					maxItems: 4,
					minItems: 4,
					type: 'array'
				},
				{
					items: {
						type: 'number'
					},
					maxItems: 6,
					minItems: 6,
					type: 'array'
				}
			],
			description: 'Bounding box https://tools.ietf.org/html/rfc7946#section-5'
		},
		BackgroundLayerSpecification: {
			additionalProperties: false,
			properties: {
				id: {
					type: 'string'
				},
				layout: {
					additionalProperties: false,
					properties: {
						visibility: {
							enum: ['visible', 'none'],
							type: 'string'
						}
					},
					type: 'object'
				},
				maxzoom: {
					type: 'number'
				},
				metadata: {},
				minzoom: {
					type: 'number'
				},
				paint: {
					additionalProperties: false,
					properties: {
						'background-color': {
							$ref: '#/definitions/PropertyValueSpecification<ColorSpecification>'
						},
						'background-opacity': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'background-pattern': {
							$ref: '#/definitions/PropertyValueSpecification<ResolvedImageSpecification>'
						}
					},
					type: 'object'
				},
				type: {
					const: 'background',
					type: 'string'
				}
			},
			required: ['id', 'type'],
			type: 'object'
		},
		'CameraFunctionSpecification<("auto"|"left"|"center"|"right")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['auto', 'left', 'center', 'right'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['auto', 'left', 'center', 'right'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("auto"|"viewport-y"|"source")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['auto', 'viewport-y', 'source'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['auto', 'viewport-y', 'source'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("bevel"|"round"|"miter")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['bevel', 'round', 'miter'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['bevel', 'round', 'miter'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("butt"|"round"|"square")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['butt', 'round', 'square'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['butt', 'round', 'square'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")>':
			{
				anyOf: [
					{
						additionalProperties: false,
						properties: {
							stops: {
								items: {
									items: [
										{
											type: 'number'
										},
										{
											enum: [
												'center',
												'left',
												'right',
												'top',
												'bottom',
												'top-left',
												'top-right',
												'bottom-left',
												'bottom-right'
											],
											type: 'string'
										}
									],
									maxItems: 2,
									minItems: 2,
									type: 'array'
								},
								type: 'array'
							},
							type: {
								const: 'exponential',
								type: 'string'
							}
						},
						required: ['type', 'stops'],
						type: 'object'
					},
					{
						additionalProperties: false,
						properties: {
							stops: {
								items: {
									items: [
										{
											type: 'number'
										},
										{
											enum: [
												'center',
												'left',
												'right',
												'top',
												'bottom',
												'top-left',
												'top-right',
												'bottom-left',
												'bottom-right'
											],
											type: 'string'
										}
									],
									maxItems: 2,
									minItems: 2,
									type: 'array'
								},
								type: 'array'
							},
							type: {
								const: 'interval',
								type: 'string'
							}
						},
						required: ['type', 'stops'],
						type: 'object'
					}
				]
			},
		'CameraFunctionSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")[]>':
			{
				anyOf: [
					{
						additionalProperties: false,
						properties: {
							stops: {
								items: {
									items: [
										{
											type: 'number'
										},
										{
											items: {
												enum: [
													'center',
													'left',
													'right',
													'top',
													'bottom',
													'top-left',
													'top-right',
													'bottom-left',
													'bottom-right'
												],
												type: 'string'
											},
											type: 'array'
										}
									],
									maxItems: 2,
									minItems: 2,
									type: 'array'
								},
								type: 'array'
							},
							type: {
								const: 'exponential',
								type: 'string'
							}
						},
						required: ['type', 'stops'],
						type: 'object'
					},
					{
						additionalProperties: false,
						properties: {
							stops: {
								items: {
									items: [
										{
											type: 'number'
										},
										{
											items: {
												enum: [
													'center',
													'left',
													'right',
													'top',
													'bottom',
													'top-left',
													'top-right',
													'bottom-left',
													'bottom-right'
												],
												type: 'string'
											},
											type: 'array'
										}
									],
									maxItems: 2,
									minItems: 2,
									type: 'array'
								},
								type: 'array'
							},
							type: {
								const: 'interval',
								type: 'string'
							}
						},
						required: ['type', 'stops'],
						type: 'object'
					}
				]
			},
		'CameraFunctionSpecification<("horizontal"|"vertical")[]>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											enum: ['horizontal', 'vertical'],
											type: 'string'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											enum: ['horizontal', 'vertical'],
											type: 'string'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("linear"|"nearest")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['linear', 'nearest'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['linear', 'nearest'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("map"|"viewport")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['map', 'viewport'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['map', 'viewport'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("map"|"viewport"|"auto")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['map', 'viewport', 'auto'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['map', 'viewport', 'auto'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("map"|"viewport"|"viewport-glyph"|"auto")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['map', 'viewport', 'viewport-glyph', 'auto'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['map', 'viewport', 'viewport-glyph', 'auto'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("never"|"always"|"cooperative")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['never', 'always', 'cooperative'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['never', 'always', 'cooperative'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("none"|"uppercase"|"lowercase")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['none', 'uppercase', 'lowercase'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['none', 'uppercase', 'lowercase'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("none"|"width"|"height"|"both")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['none', 'width', 'height', 'both'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['none', 'width', 'height', 'both'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<("point"|"line"|"line-center")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['point', 'line', 'line-center'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['point', 'line', 'line-center'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<ColorSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/ColorSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/ColorSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<FormattedSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/FormattedSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/FormattedSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<PaddingSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/PaddingSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/PaddingSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<ResolvedImageSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/ResolvedImageSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/ResolvedImageSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<VariableAnchorOffsetCollectionSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<[number,number,number,number]>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 4,
										minItems: 4,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 4,
										minItems: 4,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<[number,number,number]>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 3,
										minItems: 3,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 3,
										minItems: 3,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<[number,number]>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 2,
										minItems: 2,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 2,
										minItems: 2,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<boolean>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										type: 'boolean'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										type: 'boolean'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<number>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: {
									type: 'number'
								},
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: {
									type: 'number'
								},
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<number[]>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'number'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'number'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		'CameraFunctionSpecification<string[]>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'string'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'string'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops'],
					type: 'object'
				}
			]
		},
		CircleLayerSpecification: {
			additionalProperties: false,
			properties: {
				filter: {
					$ref: '#/definitions/FilterSpecification'
				},
				id: {
					type: 'string'
				},
				layout: {
					additionalProperties: false,
					properties: {
						'circle-sort-key': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						visibility: {
							enum: ['visible', 'none'],
							type: 'string'
						}
					},
					type: 'object'
				},
				maxzoom: {
					type: 'number'
				},
				metadata: {},
				minzoom: {
					type: 'number'
				},
				paint: {
					additionalProperties: false,
					properties: {
						'circle-blur': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'circle-color': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ColorSpecification>'
						},
						'circle-opacity': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'circle-pitch-alignment': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport")>'
						},
						'circle-pitch-scale': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport")>'
						},
						'circle-radius': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'circle-stroke-color': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ColorSpecification>'
						},
						'circle-stroke-opacity': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'circle-stroke-width': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'circle-translate': {
							$ref: '#/definitions/PropertyValueSpecification<[number,number]>'
						},
						'circle-translate-anchor': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport")>'
						}
					},
					type: 'object'
				},
				source: {
					type: 'string'
				},
				'source-layer': {
					type: 'string'
				},
				type: {
					const: 'circle',
					type: 'string'
				}
			},
			required: ['id', 'type', 'source'],
			type: 'object'
		},
		ColorReliefLayerSpecification: {
			additionalProperties: false,
			properties: {
				filter: {
					$ref: '#/definitions/FilterSpecification'
				},
				id: {
					type: 'string'
				},
				layout: {
					additionalProperties: false,
					properties: {
						visibility: {
							enum: ['visible', 'none'],
							type: 'string'
						}
					},
					type: 'object'
				},
				maxzoom: {
					type: 'number'
				},
				metadata: {},
				minzoom: {
					type: 'number'
				},
				paint: {
					additionalProperties: false,
					properties: {
						'color-relief-color': {
							$ref: '#/definitions/PropertyValueSpecification<ColorSpecification>'
						},
						'color-relief-opacity': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						resampling: {
							$ref: '#/definitions/PropertyValueSpecification<("linear"|"nearest")>'
						}
					},
					type: 'object'
				},
				source: {
					type: 'string'
				},
				'source-layer': {
					type: 'string'
				},
				type: {
					const: 'color-relief',
					type: 'string'
				}
			},
			required: ['id', 'type', 'source'],
			type: 'object'
		},
		CollatorExpressionSpecification: {
			items: [
				{
					const: 'collator',
					type: 'string'
				},
				{
					additionalProperties: false,
					properties: {
						'case-sensitive': {
							anyOf: [
								{
									type: 'boolean'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						'diacritic-sensitive': {
							anyOf: [
								{
									type: 'boolean'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						locale: {
							anyOf: [
								{
									type: 'string'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					},
					type: 'object'
				}
			],
			maxItems: 2,
			minItems: 2,
			type: 'array'
		},
		ColorSpecification: {
			type: 'string'
		},
		'CompositeFunctionSpecification<("auto"|"left"|"center"|"right")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['auto', 'left', 'center', 'right'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										enum: ['auto', 'left', 'center', 'right'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['auto', 'left', 'center', 'right'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										enum: ['auto', 'left', 'center', 'right'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['auto', 'left', 'center', 'right'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: ['string', 'number', 'boolean']
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										enum: ['auto', 'left', 'center', 'right'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				}
			]
		},
		'CompositeFunctionSpecification<("bevel"|"round"|"miter")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['bevel', 'round', 'miter'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										enum: ['bevel', 'round', 'miter'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['bevel', 'round', 'miter'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										enum: ['bevel', 'round', 'miter'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['bevel', 'round', 'miter'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: ['string', 'number', 'boolean']
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										enum: ['bevel', 'round', 'miter'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				}
			]
		},
		'CompositeFunctionSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")>':
			{
				anyOf: [
					{
						additionalProperties: false,
						properties: {
							default: {
								enum: [
									'center',
									'left',
									'right',
									'top',
									'bottom',
									'top-left',
									'top-right',
									'bottom-left',
									'bottom-right'
								],
								type: 'string'
							},
							property: {
								type: 'string'
							},
							stops: {
								items: {
									items: [
										{
											additionalProperties: false,
											properties: {
												value: {
													type: 'number'
												},
												zoom: {
													type: 'number'
												}
											},
											required: ['zoom', 'value'],
											type: 'object'
										},
										{
											enum: [
												'center',
												'left',
												'right',
												'top',
												'bottom',
												'top-left',
												'top-right',
												'bottom-left',
												'bottom-right'
											],
											type: 'string'
										}
									],
									maxItems: 2,
									minItems: 2,
									type: 'array'
								},
								type: 'array'
							},
							type: {
								const: 'exponential',
								type: 'string'
							}
						},
						required: ['type', 'stops', 'property'],
						type: 'object'
					},
					{
						additionalProperties: false,
						properties: {
							default: {
								enum: [
									'center',
									'left',
									'right',
									'top',
									'bottom',
									'top-left',
									'top-right',
									'bottom-left',
									'bottom-right'
								],
								type: 'string'
							},
							property: {
								type: 'string'
							},
							stops: {
								items: {
									items: [
										{
											additionalProperties: false,
											properties: {
												value: {
													type: 'number'
												},
												zoom: {
													type: 'number'
												}
											},
											required: ['zoom', 'value'],
											type: 'object'
										},
										{
											enum: [
												'center',
												'left',
												'right',
												'top',
												'bottom',
												'top-left',
												'top-right',
												'bottom-left',
												'bottom-right'
											],
											type: 'string'
										}
									],
									maxItems: 2,
									minItems: 2,
									type: 'array'
								},
								type: 'array'
							},
							type: {
								const: 'interval',
								type: 'string'
							}
						},
						required: ['type', 'stops', 'property'],
						type: 'object'
					},
					{
						additionalProperties: false,
						properties: {
							default: {
								enum: [
									'center',
									'left',
									'right',
									'top',
									'bottom',
									'top-left',
									'top-right',
									'bottom-left',
									'bottom-right'
								],
								type: 'string'
							},
							property: {
								type: 'string'
							},
							stops: {
								items: {
									items: [
										{
											additionalProperties: false,
											properties: {
												value: {
													type: ['string', 'number', 'boolean']
												},
												zoom: {
													type: 'number'
												}
											},
											required: ['zoom', 'value'],
											type: 'object'
										},
										{
											enum: [
												'center',
												'left',
												'right',
												'top',
												'bottom',
												'top-left',
												'top-right',
												'bottom-left',
												'bottom-right'
											],
											type: 'string'
										}
									],
									maxItems: 2,
									minItems: 2,
									type: 'array'
								},
								type: 'array'
							},
							type: {
								const: 'categorical',
								type: 'string'
							}
						},
						required: ['type', 'stops', 'property'],
						type: 'object'
					}
				]
			},
		'CompositeFunctionSpecification<("none"|"uppercase"|"lowercase")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['none', 'uppercase', 'lowercase'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										enum: ['none', 'uppercase', 'lowercase'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['none', 'uppercase', 'lowercase'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										enum: ['none', 'uppercase', 'lowercase'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['none', 'uppercase', 'lowercase'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: ['string', 'number', 'boolean']
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										enum: ['none', 'uppercase', 'lowercase'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				}
			]
		},
		'CompositeFunctionSpecification<ColorSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ColorSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/ColorSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ColorSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/ColorSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ColorSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: ['string', 'number', 'boolean']
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/ColorSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				}
			]
		},
		'CompositeFunctionSpecification<FormattedSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/FormattedSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/FormattedSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/FormattedSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/FormattedSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/FormattedSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: ['string', 'number', 'boolean']
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/FormattedSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				}
			]
		},
		'CompositeFunctionSpecification<PaddingSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/PaddingSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/PaddingSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/PaddingSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/PaddingSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/PaddingSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: ['string', 'number', 'boolean']
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/PaddingSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				}
			]
		},
		'CompositeFunctionSpecification<ResolvedImageSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ResolvedImageSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/ResolvedImageSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ResolvedImageSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/ResolvedImageSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ResolvedImageSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: ['string', 'number', 'boolean']
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/ResolvedImageSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				}
			]
		},
		'CompositeFunctionSpecification<VariableAnchorOffsetCollectionSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: ['string', 'number', 'boolean']
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				}
			]
		},
		'CompositeFunctionSpecification<[number,number]>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'number'
							},
							maxItems: 2,
							minItems: 2,
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 2,
										minItems: 2,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'number'
							},
							maxItems: 2,
							minItems: 2,
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 2,
										minItems: 2,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'number'
							},
							maxItems: 2,
							minItems: 2,
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: ['string', 'number', 'boolean']
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 2,
										minItems: 2,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				}
			]
		},
		'CompositeFunctionSpecification<number>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							type: 'number'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										type: 'number'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							type: 'number'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										type: 'number'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							type: 'number'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: ['string', 'number', 'boolean']
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										type: 'number'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				}
			]
		},
		'CompositeFunctionSpecification<string[]>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'string'
							},
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										items: {
											type: 'string'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'string'
							},
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: 'number'
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										items: {
											type: 'string'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'string'
							},
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										additionalProperties: false,
										properties: {
											value: {
												type: ['string', 'number', 'boolean']
											},
											zoom: {
												type: 'number'
											}
										},
										required: ['zoom', 'value'],
										type: 'object'
									},
									{
										items: {
											type: 'string'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				}
			]
		},
		'DataDrivenPropertyValueSpecification<("auto"|"left"|"center"|"right")>': {
			anyOf: [
				{
					const: 'auto',
					type: 'string'
				},
				{
					const: 'left',
					type: 'string'
				},
				{
					const: 'center',
					type: 'string'
				},
				{
					const: 'right',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("auto"|"left"|"center"|"right")>'
				},
				{
					$ref: '#/definitions/SourceFunctionSpecification<("auto"|"left"|"center"|"right")>'
				},
				{
					$ref: '#/definitions/CompositeFunctionSpecification<("auto"|"left"|"center"|"right")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'DataDrivenPropertyValueSpecification<("bevel"|"round"|"miter")>': {
			anyOf: [
				{
					const: 'bevel',
					type: 'string'
				},
				{
					const: 'round',
					type: 'string'
				},
				{
					const: 'miter',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("bevel"|"round"|"miter")>'
				},
				{
					$ref: '#/definitions/SourceFunctionSpecification<("bevel"|"round"|"miter")>'
				},
				{
					$ref: '#/definitions/CompositeFunctionSpecification<("bevel"|"round"|"miter")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'DataDrivenPropertyValueSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")>':
			{
				anyOf: [
					{
						const: 'center',
						type: 'string'
					},
					{
						const: 'left',
						type: 'string'
					},
					{
						const: 'right',
						type: 'string'
					},
					{
						const: 'top',
						type: 'string'
					},
					{
						const: 'bottom',
						type: 'string'
					},
					{
						const: 'top-left',
						type: 'string'
					},
					{
						const: 'top-right',
						type: 'string'
					},
					{
						const: 'bottom-left',
						type: 'string'
					},
					{
						const: 'bottom-right',
						type: 'string'
					},
					{
						$ref: '#/definitions/CameraFunctionSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")>'
					},
					{
						$ref: '#/definitions/SourceFunctionSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")>'
					},
					{
						$ref: '#/definitions/CompositeFunctionSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")>'
					},
					{
						$ref: '#/definitions/ExpressionSpecification'
					}
				]
			},
		'DataDrivenPropertyValueSpecification<("none"|"uppercase"|"lowercase")>': {
			anyOf: [
				{
					const: 'none',
					type: 'string'
				},
				{
					const: 'uppercase',
					type: 'string'
				},
				{
					const: 'lowercase',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("none"|"uppercase"|"lowercase")>'
				},
				{
					$ref: '#/definitions/SourceFunctionSpecification<("none"|"uppercase"|"lowercase")>'
				},
				{
					$ref: '#/definitions/CompositeFunctionSpecification<("none"|"uppercase"|"lowercase")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'DataDrivenPropertyValueSpecification<ColorSpecification>': {
			anyOf: [
				{
					$ref: '#/definitions/ColorSpecification'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<ColorSpecification>'
				},
				{
					$ref: '#/definitions/SourceFunctionSpecification<ColorSpecification>'
				},
				{
					$ref: '#/definitions/CompositeFunctionSpecification<ColorSpecification>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'DataDrivenPropertyValueSpecification<FormattedSpecification>': {
			anyOf: [
				{
					$ref: '#/definitions/FormattedSpecification'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<FormattedSpecification>'
				},
				{
					$ref: '#/definitions/SourceFunctionSpecification<FormattedSpecification>'
				},
				{
					$ref: '#/definitions/CompositeFunctionSpecification<FormattedSpecification>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'DataDrivenPropertyValueSpecification<PaddingSpecification>': {
			anyOf: [
				{
					$ref: '#/definitions/PaddingSpecification'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<PaddingSpecification>'
				},
				{
					$ref: '#/definitions/SourceFunctionSpecification<PaddingSpecification>'
				},
				{
					$ref: '#/definitions/CompositeFunctionSpecification<PaddingSpecification>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'DataDrivenPropertyValueSpecification<ResolvedImageSpecification>': {
			anyOf: [
				{
					$ref: '#/definitions/ResolvedImageSpecification'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<ResolvedImageSpecification>'
				},
				{
					$ref: '#/definitions/SourceFunctionSpecification<ResolvedImageSpecification>'
				},
				{
					$ref: '#/definitions/CompositeFunctionSpecification<ResolvedImageSpecification>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'DataDrivenPropertyValueSpecification<VariableAnchorOffsetCollectionSpecification>': {
			anyOf: [
				{
					$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<VariableAnchorOffsetCollectionSpecification>'
				},
				{
					$ref: '#/definitions/SourceFunctionSpecification<VariableAnchorOffsetCollectionSpecification>'
				},
				{
					$ref: '#/definitions/CompositeFunctionSpecification<VariableAnchorOffsetCollectionSpecification>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'DataDrivenPropertyValueSpecification<[number,number]>': {
			anyOf: [
				{
					items: {
						type: 'number'
					},
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<[number,number]>'
				},
				{
					$ref: '#/definitions/SourceFunctionSpecification<[number,number]>'
				},
				{
					$ref: '#/definitions/CompositeFunctionSpecification<[number,number]>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'DataDrivenPropertyValueSpecification<number>': {
			anyOf: [
				{
					type: 'number'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<number>'
				},
				{
					$ref: '#/definitions/SourceFunctionSpecification<number>'
				},
				{
					$ref: '#/definitions/CompositeFunctionSpecification<number>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'DataDrivenPropertyValueSpecification<string[]>': {
			anyOf: [
				{
					items: {
						type: 'string'
					},
					type: 'array'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<string[]>'
				},
				{
					$ref: '#/definitions/SourceFunctionSpecification<string[]>'
				},
				{
					$ref: '#/definitions/CompositeFunctionSpecification<string[]>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		ExpressionFilterSpecification: {
			anyOf: [
				{
					type: 'boolean'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		ExpressionInputType: {
			type: ['string', 'number', 'boolean']
		},
		ExpressionSpecification: {
			anyOf: [
				{
					items: [
						{
							const: 'array',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'array',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: 'array',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 4,
					minItems: 4,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'boolean',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 2,
					type: 'array'
				},
				{
					$ref: '#/definitions/CollatorExpressionSpecification'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'string'
							},
							{
								items: [
									{
										const: 'image',
										type: 'string'
									},
									{
										$ref: '#/definitions/ExpressionSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							},
							{
								additionalProperties: false,
								properties: {
									'font-scale': {
										anyOf: [
											{
												type: 'number'
											},
											{
												$ref: '#/definitions/ExpressionSpecification'
											}
										]
									},
									'text-color': {
										anyOf: [
											{
												$ref: '#/definitions/ColorSpecification'
											},
											{
												$ref: '#/definitions/ExpressionSpecification'
											}
										]
									},
									'text-font': {
										anyOf: [
											{
												items: {
													type: 'string'
												},
												type: 'array'
											},
											{
												$ref: '#/definitions/ExpressionSpecification'
											}
										]
									}
								},
								type: 'object'
							}
						]
					},
					items: [
						{
							const: 'format',
							type: 'string'
						}
					],
					minItems: 1,
					type: 'array'
				},
				{
					items: [
						{
							const: 'image',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'literal',
							type: 'string'
						},
						{}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'number',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'number-format',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							additionalProperties: false,
							properties: {
								currency: {
									anyOf: [
										{
											type: 'string'
										},
										{
											$ref: '#/definitions/ExpressionSpecification'
										}
									]
								},
								locale: {
									anyOf: [
										{
											type: 'string'
										},
										{
											$ref: '#/definitions/ExpressionSpecification'
										}
									]
								},
								'max-fraction-digits': {
									anyOf: [
										{
											type: 'number'
										},
										{
											$ref: '#/definitions/ExpressionSpecification'
										}
									]
								},
								'min-fraction-digits': {
									anyOf: [
										{
											type: 'number'
										},
										{
											$ref: '#/definitions/ExpressionSpecification'
										}
									]
								}
							},
							type: 'object'
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'object',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 2,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'string',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'to-boolean',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'to-color',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 2,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'to-number',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'to-string',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: {
						const: 'accumulated',
						type: 'string'
					},
					maxItems: 1,
					minItems: 1,
					type: 'array'
				},
				{
					items: [
						{
							const: 'feature-state',
							type: 'string'
						},
						{
							type: 'string'
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: {
						const: 'geometry-type',
						type: 'string'
					},
					maxItems: 1,
					minItems: 1,
					type: 'array'
				},
				{
					items: {
						const: 'id',
						type: 'string'
					},
					maxItems: 1,
					minItems: 1,
					type: 'array'
				},
				{
					items: {
						const: 'line-progress',
						type: 'string'
					},
					maxItems: 1,
					minItems: 1,
					type: 'array'
				},
				{
					items: {
						const: 'properties',
						type: 'string'
					},
					maxItems: 1,
					minItems: 1,
					type: 'array'
				},
				{
					items: [
						{
							const: 'at',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							$ref: '#/definitions/ExpressionSpecification'
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: 'get',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'string'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									additionalProperties: {},
									type: 'object'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 3,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'has',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'string'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									additionalProperties: {},
									type: 'object'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 3,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'in',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: 'index-of',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: 'length',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'string'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'slice',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'string'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 4,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '!',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'boolean'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: '!=',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							$ref: '#/definitions/CollatorExpressionSpecification'
						}
					],
					maxItems: 4,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '<',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							$ref: '#/definitions/CollatorExpressionSpecification'
						}
					],
					maxItems: 4,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '<=',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							$ref: '#/definitions/CollatorExpressionSpecification'
						}
					],
					maxItems: 4,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '==',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							$ref: '#/definitions/CollatorExpressionSpecification'
						}
					],
					maxItems: 4,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '>',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							$ref: '#/definitions/CollatorExpressionSpecification'
						}
					],
					maxItems: 4,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '>=',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							$ref: '#/definitions/CollatorExpressionSpecification'
						}
					],
					maxItems: 4,
					minItems: 3,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'boolean'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'all',
							type: 'string'
						}
					],
					minItems: 1,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'boolean'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'any',
							type: 'string'
						}
					],
					minItems: 1,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'boolean'
							},
							{
								$ref: '#/definitions/ExpressionInputType'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'case',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'boolean'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 4,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								$ref: '#/definitions/ExpressionInputType'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'coalesce',
							type: 'string'
						}
					],
					minItems: 1,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								$ref: '#/definitions/ExpressionInputType'
							},
							{
								items: {
									$ref: '#/definitions/ExpressionInputType'
								},
								type: 'array'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'match',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									items: {
										$ref: '#/definitions/ExpressionInputType'
									},
									type: 'array'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 5,
					type: 'array'
				},
				{
					items: [
						{
							const: 'within',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'distance',
							type: 'string'
						},
						{
							anyOf: [
								{},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'number'
							},
							{
								items: {
									type: 'number'
								},
								type: 'array'
							},
							{
								$ref: '#/definitions/ColorSpecification'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'interpolate',
							type: 'string'
						},
						{
							$ref: '#/definitions/InterpolationSpecification'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 3,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'number'
							},
							{
								$ref: '#/definitions/ColorSpecification'
							}
						]
					},
					items: [
						{
							const: 'interpolate-hcl',
							type: 'string'
						},
						{
							$ref: '#/definitions/InterpolationSpecification'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 3,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'number'
							},
							{
								$ref: '#/definitions/ColorSpecification'
							}
						]
					},
					items: [
						{
							const: 'interpolate-lab',
							type: 'string'
						},
						{
							$ref: '#/definitions/InterpolationSpecification'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 3,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'number'
							},
							{
								$ref: '#/definitions/ExpressionInputType'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'step',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 3,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'string'
							},
							{
								$ref: '#/definitions/ExpressionInputType'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'let',
							type: 'string'
						},
						{
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ExpressionInputType'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: 'var',
							type: 'string'
						},
						{
							type: 'string'
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								$ref: '#/definitions/ExpressionInputType'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'concat',
							type: 'string'
						}
					],
					minItems: 1,
					type: 'array'
				},
				{
					items: [
						{
							const: 'downcase',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'string'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'is-supported-script',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'string'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'resolved-locale',
							type: 'string'
						},
						{
							$ref: '#/definitions/CollatorExpressionSpecification'
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'upcase',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'string'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'rgb',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 4,
					minItems: 4,
					type: 'array'
				},
				{
					items: [
						{
							const: 'rgba',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 5,
					minItems: 5,
					type: 'array'
				},
				{
					items: [
						{
							const: 'to-rgba',
							type: 'string'
						},
						{
							anyOf: [
								{
									$ref: '#/definitions/ColorSpecification'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: '-',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 3,
					minItems: 2,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'number'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: '*',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '/',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '%',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '^',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'number'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: '+',
							type: 'string'
						}
					],
					minItems: 1,
					type: 'array'
				},
				{
					items: [
						{
							const: 'abs',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'acos',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'asin',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'atan',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'ceil',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'cos',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'distance',
							type: 'string'
						},
						{
							anyOf: [
								{
									additionalProperties: {},
									type: 'object'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: {
						const: 'ExpressionSpecification',
						type: 'string'
					},
					maxItems: 1,
					minItems: 1,
					type: 'array'
				},
				{
					items: [
						{
							const: 'floor',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'ln',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: {
						const: 'ln2',
						type: 'string'
					},
					maxItems: 1,
					minItems: 1,
					type: 'array'
				},
				{
					items: [
						{
							const: 'log10',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'log2',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'number'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'max',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 2,
					type: 'array'
				},
				{
					additionalItems: {
						anyOf: [
							{
								type: 'number'
							},
							{
								$ref: '#/definitions/ExpressionSpecification'
							}
						]
					},
					items: [
						{
							const: 'min',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					minItems: 2,
					type: 'array'
				},
				{
					items: {
						const: 'pi',
						type: 'string'
					},
					maxItems: 1,
					minItems: 1,
					type: 'array'
				},
				{
					items: [
						{
							const: 'round',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'sin',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'sqrt',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'tan',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: {
						const: 'zoom',
						type: 'string'
					},
					maxItems: 1,
					minItems: 1,
					type: 'array'
				},
				{
					items: {
						const: 'heatmap-density',
						type: 'string'
					},
					maxItems: 1,
					minItems: 1,
					type: 'array'
				}
			]
		},
		Feature: {
			additionalProperties: false,
			description:
				'A feature object which contains a geometry and associated properties. https://tools.ietf.org/html/rfc7946#section-3.2',
			properties: {
				bbox: {
					$ref: '#/definitions/BBox',
					description:
						"Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections. The value of the bbox member is an array of length 2*n where n is the number of dimensions represented in the contained geometries, with all axes of the most southwesterly point followed by all axes of the more northeasterly point. The axes order of a bbox follows the axes order of geometries. https://tools.ietf.org/html/rfc7946#section-5"
				},
				geometry: {
					$ref: '#/definitions/Geometry',
					description: "The feature's geometry"
				},
				id: {
					description:
						'A value that uniquely identifies this feature in a https://tools.ietf.org/html/rfc7946#section-3.2.',
					type: ['string', 'number']
				},
				properties: {
					$ref: '#/definitions/GeoJsonProperties',
					description: 'Properties associated with this feature.'
				},
				type: {
					const: 'Feature',
					description: 'Specifies the type of GeoJSON object.',
					type: 'string'
				}
			},
			required: ['geometry', 'properties', 'type'],
			type: 'object'
		},
		'Feature<Geometry,GeoJsonProperties>': {
			additionalProperties: false,
			description:
				'A feature object which contains a geometry and associated properties. https://tools.ietf.org/html/rfc7946#section-3.2',
			properties: {
				bbox: {
					$ref: '#/definitions/BBox',
					description:
						"Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections. The value of the bbox member is an array of length 2*n where n is the number of dimensions represented in the contained geometries, with all axes of the most southwesterly point followed by all axes of the more northeasterly point. The axes order of a bbox follows the axes order of geometries. https://tools.ietf.org/html/rfc7946#section-5"
				},
				geometry: {
					$ref: '#/definitions/Geometry',
					description: "The feature's geometry"
				},
				id: {
					description:
						'A value that uniquely identifies this feature in a https://tools.ietf.org/html/rfc7946#section-3.2.',
					type: ['string', 'number']
				},
				properties: {
					$ref: '#/definitions/GeoJsonProperties',
					description: 'Properties associated with this feature.'
				},
				type: {
					const: 'Feature',
					description: 'Specifies the type of GeoJSON object.',
					type: 'string'
				}
			},
			required: ['geometry', 'properties', 'type'],
			type: 'object'
		},
		FeatureCollection: {
			additionalProperties: false,
			description:
				'A collection of feature objects.  https://tools.ietf.org/html/rfc7946#section-3.3',
			properties: {
				bbox: {
					$ref: '#/definitions/BBox',
					description:
						"Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections. The value of the bbox member is an array of length 2*n where n is the number of dimensions represented in the contained geometries, with all axes of the most southwesterly point followed by all axes of the more northeasterly point. The axes order of a bbox follows the axes order of geometries. https://tools.ietf.org/html/rfc7946#section-5"
				},
				features: {
					items: {
						$ref: '#/definitions/Feature<Geometry,GeoJsonProperties>'
					},
					type: 'array'
				},
				type: {
					const: 'FeatureCollection',
					description: 'Specifies the type of GeoJSON object.',
					type: 'string'
				}
			},
			required: ['features', 'type'],
			type: 'object'
		},
		FillExtrusionLayerSpecification: {
			additionalProperties: false,
			properties: {
				filter: {
					$ref: '#/definitions/FilterSpecification'
				},
				id: {
					type: 'string'
				},
				layout: {
					additionalProperties: false,
					properties: {
						visibility: {
							enum: ['visible', 'none'],
							type: 'string'
						}
					},
					type: 'object'
				},
				maxzoom: {
					type: 'number'
				},
				metadata: {},
				minzoom: {
					type: 'number'
				},
				paint: {
					additionalProperties: false,
					properties: {
						'fill-extrusion-base': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'fill-extrusion-color': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ColorSpecification>'
						},
						'fill-extrusion-height': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'fill-extrusion-opacity': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'fill-extrusion-pattern': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ResolvedImageSpecification>'
						},
						'fill-extrusion-translate': {
							$ref: '#/definitions/PropertyValueSpecification<[number,number]>'
						},
						'fill-extrusion-translate-anchor': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport")>'
						},
						'fill-extrusion-vertical-gradient': {
							$ref: '#/definitions/PropertyValueSpecification<boolean>'
						}
					},
					type: 'object'
				},
				source: {
					type: 'string'
				},
				'source-layer': {
					type: 'string'
				},
				type: {
					const: 'fill-extrusion',
					type: 'string'
				}
			},
			required: ['id', 'type', 'source'],
			type: 'object'
		},
		FillLayerSpecification: {
			additionalProperties: false,
			properties: {
				filter: {
					$ref: '#/definitions/FilterSpecification'
				},
				id: {
					type: 'string'
				},
				layout: {
					additionalProperties: false,
					properties: {
						'fill-sort-key': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						visibility: {
							enum: ['visible', 'none'],
							type: 'string'
						}
					},
					type: 'object'
				},
				maxzoom: {
					type: 'number'
				},
				metadata: {},
				minzoom: {
					type: 'number'
				},
				paint: {
					additionalProperties: false,
					properties: {
						'fill-antialias': {
							$ref: '#/definitions/PropertyValueSpecification<boolean>'
						},
						'fill-color': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ColorSpecification>'
						},
						'fill-opacity': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'fill-outline-color': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ColorSpecification>'
						},
						'fill-pattern': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ResolvedImageSpecification>'
						},
						'fill-translate': {
							$ref: '#/definitions/PropertyValueSpecification<[number,number]>'
						},
						'fill-translate-anchor': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport")>'
						}
					},
					type: 'object'
				},
				source: {
					type: 'string'
				},
				'source-layer': {
					type: 'string'
				},
				type: {
					const: 'fill',
					type: 'string'
				}
			},
			required: ['id', 'type', 'source'],
			type: 'object'
		},
		FilterSpecification: {
			anyOf: [
				{
					$ref: '#/definitions/ExpressionFilterSpecification'
				},
				{
					$ref: '#/definitions/LegacyFilterSpecification'
				}
			]
		},
		FormattedSpecification: {
			type: 'string'
		},
		GeoJSON: {
			anyOf: [
				{
					$ref: '#/definitions/Geometry'
				},
				{
					$ref: '#/definitions/Feature'
				},
				{
					$ref: '#/definitions/FeatureCollection'
				}
			],
			description: 'Union of GeoJSON objects.'
		},
		GeoJSONSourceSpecification: {
			additionalProperties: false,
			properties: {
				attribution: {
					type: 'string'
				},
				buffer: {
					type: 'number'
				},
				cluster: {
					type: 'boolean'
				},
				clusterMaxZoom: {
					type: 'number'
				},
				clusterMinPoints: {
					type: 'number'
				},
				clusterProperties: {},
				clusterRadius: {
					type: 'number'
				},
				data: {
					anyOf: [
						{
							$ref: '#/definitions/GeoJSON'
						},
						{
							type: 'string'
						}
					]
				},
				filter: {},
				generateId: {
					type: 'boolean'
				},
				lineMetrics: {
					type: 'boolean'
				},
				maxzoom: {
					type: 'number'
				},
				promoteId: {
					$ref: '#/definitions/PromoteIdSpecification'
				},
				tolerance: {
					type: 'number'
				},
				type: {
					const: 'geojson',
					type: 'string'
				}
			},
			required: ['type', 'data'],
			type: 'object'
		},
		GeoJsonProperties: {
			anyOf: [
				{
					type: 'object'
				},
				{
					type: 'null'
				}
			]
		},
		Geometry: {
			anyOf: [
				{
					$ref: '#/definitions/Point'
				},
				{
					$ref: '#/definitions/MultiPoint'
				},
				{
					$ref: '#/definitions/LineString'
				},
				{
					$ref: '#/definitions/MultiLineString'
				},
				{
					$ref: '#/definitions/Polygon'
				},
				{
					$ref: '#/definitions/MultiPolygon'
				},
				{
					$ref: '#/definitions/GeometryCollection'
				}
			],
			description: 'Geometry object. https://tools.ietf.org/html/rfc7946#section-3'
		},
		GeometryCollection: {
			additionalProperties: false,
			description: 'Geometry Collection https://tools.ietf.org/html/rfc7946#section-3.1.8',
			properties: {
				bbox: {
					$ref: '#/definitions/BBox',
					description:
						"Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections. The value of the bbox member is an array of length 2*n where n is the number of dimensions represented in the contained geometries, with all axes of the most southwesterly point followed by all axes of the more northeasterly point. The axes order of a bbox follows the axes order of geometries. https://tools.ietf.org/html/rfc7946#section-5"
				},
				geometries: {
					items: {
						$ref: '#/definitions/Geometry'
					},
					type: 'array'
				},
				type: {
					const: 'GeometryCollection',
					description: 'Specifies the type of GeoJSON object.',
					type: 'string'
				}
			},
			required: ['geometries', 'type'],
			type: 'object'
		},
		HeatmapLayerSpecification: {
			additionalProperties: false,
			properties: {
				filter: {
					$ref: '#/definitions/FilterSpecification'
				},
				id: {
					type: 'string'
				},
				layout: {
					additionalProperties: false,
					properties: {
						visibility: {
							enum: ['visible', 'none'],
							type: 'string'
						}
					},
					type: 'object'
				},
				maxzoom: {
					type: 'number'
				},
				metadata: {},
				minzoom: {
					type: 'number'
				},
				paint: {
					additionalProperties: false,
					properties: {
						'heatmap-color': {
							$ref: '#/definitions/ExpressionSpecification'
						},
						'heatmap-intensity': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'heatmap-opacity': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'heatmap-radius': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'heatmap-weight': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						}
					},
					type: 'object'
				},
				source: {
					type: 'string'
				},
				'source-layer': {
					type: 'string'
				},
				type: {
					const: 'heatmap',
					type: 'string'
				}
			},
			required: ['id', 'type', 'source'],
			type: 'object'
		},
		HillshadeLayerSpecification: {
			additionalProperties: false,
			properties: {
				filter: {
					$ref: '#/definitions/FilterSpecification'
				},
				id: {
					type: 'string'
				},
				layout: {
					additionalProperties: false,
					properties: {
						visibility: {
							enum: ['visible', 'none'],
							type: 'string'
						}
					},
					type: 'object'
				},
				maxzoom: {
					type: 'number'
				},
				metadata: {},
				minzoom: {
					type: 'number'
				},
				paint: {
					additionalProperties: false,
					properties: {
						'hillshade-accent-color': {
							$ref: '#/definitions/PropertyValueSpecification<ColorSpecification>'
						},
						'hillshade-exaggeration': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'hillshade-highlight-color': {
							$ref: '#/definitions/PropertyValueSpecification<ColorSpecification>'
						},
						'hillshade-illumination-anchor': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport")>'
						},
						'hillshade-illumination-direction': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'hillshade-shadow-color': {
							$ref: '#/definitions/PropertyValueSpecification<ColorSpecification>'
						}
					},
					type: 'object'
				},
				source: {
					type: 'string'
				},
				'source-layer': {
					type: 'string'
				},
				type: {
					const: 'hillshade',
					type: 'string'
				}
			},
			required: ['id', 'type', 'source'],
			type: 'object'
		},
		ImageSourceSpecification: {
			additionalProperties: false,
			properties: {
				coordinates: {
					items: {
						items: {
							type: 'number'
						},
						maxItems: 2,
						minItems: 2,
						type: 'array'
					},
					maxItems: 4,
					minItems: 4,
					type: 'array'
				},
				type: {
					const: 'image',
					type: 'string'
				},
				url: {
					type: 'string'
				}
			},
			required: ['type', 'url', 'coordinates'],
			type: 'object'
		},
		InterpolationSpecification: {
			anyOf: [
				{
					items: {
						const: 'linear',
						type: 'string'
					},
					maxItems: 1,
					minItems: 1,
					type: 'array'
				},
				{
					items: [
						{
							const: 'exponential',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: 'cubic-bezier',
							type: 'string'
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						},
						{
							anyOf: [
								{
									type: 'number'
								},
								{
									$ref: '#/definitions/ExpressionSpecification'
								}
							]
						}
					],
					maxItems: 5,
					minItems: 5,
					type: 'array'
				}
			]
		},
		LayerSpecification: {
			anyOf: [
				{
					$ref: '#/definitions/FillLayerSpecification'
				},
				{
					$ref: '#/definitions/LineLayerSpecification'
				},
				{
					$ref: '#/definitions/SymbolLayerSpecification'
				},
				{
					$ref: '#/definitions/CircleLayerSpecification'
				},
				{
					$ref: '#/definitions/HeatmapLayerSpecification'
				},
				{
					$ref: '#/definitions/FillExtrusionLayerSpecification'
				},
				{
					$ref: '#/definitions/RasterLayerSpecification'
				},
				{
					$ref: '#/definitions/HillshadeLayerSpecification'
				},
				{
					$ref: '#/definitions/ColorReliefLayerSpecification'
				},
				{
					$ref: '#/definitions/BackgroundLayerSpecification'
				}
			]
		},
		LegacyFilterSpecification: {
			anyOf: [
				{
					items: [
						{
							const: 'has',
							type: 'string'
						},
						{
							type: 'string'
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: '!has',
							type: 'string'
						},
						{
							type: 'string'
						}
					],
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					items: [
						{
							const: '==',
							type: 'string'
						},
						{
							type: 'string'
						},
						{
							type: ['string', 'number', 'boolean']
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '!=',
							type: 'string'
						},
						{
							type: 'string'
						},
						{
							type: ['string', 'number', 'boolean']
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '>',
							type: 'string'
						},
						{
							type: 'string'
						},
						{
							type: ['string', 'number', 'boolean']
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '>=',
							type: 'string'
						},
						{
							type: 'string'
						},
						{
							type: ['string', 'number', 'boolean']
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '<',
							type: 'string'
						},
						{
							type: 'string'
						},
						{
							type: ['string', 'number', 'boolean']
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					items: [
						{
							const: '<=',
							type: 'string'
						},
						{
							type: 'string'
						},
						{
							type: ['string', 'number', 'boolean']
						}
					],
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					additionalItems: {
						type: ['string', 'number', 'boolean']
					},
					items: [
						{
							const: 'in',
							type: 'string'
						},
						{
							type: 'string'
						}
					],
					minItems: 2,
					type: 'array'
				},
				{
					additionalItems: {
						type: ['string', 'number', 'boolean']
					},
					items: [
						{
							const: '!in',
							type: 'string'
						},
						{
							type: 'string'
						}
					],
					minItems: 2,
					type: 'array'
				},
				{
					additionalItems: {
						$ref: '#/definitions/LegacyFilterSpecification'
					},
					items: [
						{
							const: 'all',
							type: 'string'
						}
					],
					minItems: 1,
					type: 'array'
				},
				{
					additionalItems: {
						$ref: '#/definitions/LegacyFilterSpecification'
					},
					items: [
						{
							const: 'any',
							type: 'string'
						}
					],
					minItems: 1,
					type: 'array'
				},
				{
					additionalItems: {
						$ref: '#/definitions/LegacyFilterSpecification'
					},
					items: [
						{
							const: 'none',
							type: 'string'
						}
					],
					minItems: 1,
					type: 'array'
				}
			]
		},
		LightSpecification: {
			additionalProperties: false,
			properties: {
				anchor: {
					$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport")>'
				},
				color: {
					$ref: '#/definitions/PropertyValueSpecification<ColorSpecification>'
				},
				intensity: {
					$ref: '#/definitions/PropertyValueSpecification<number>'
				},
				position: {
					$ref: '#/definitions/PropertyValueSpecification<[number,number,number]>'
				}
			},
			type: 'object'
		},
		LineLayerSpecification: {
			additionalProperties: false,
			properties: {
				filter: {
					$ref: '#/definitions/FilterSpecification'
				},
				id: {
					type: 'string'
				},
				layout: {
					additionalProperties: false,
					properties: {
						'line-cap': {
							$ref: '#/definitions/PropertyValueSpecification<("butt"|"round"|"square")>'
						},
						'line-join': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<("bevel"|"round"|"miter")>'
						},
						'line-miter-limit': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'line-round-limit': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'line-sort-key': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						visibility: {
							enum: ['visible', 'none'],
							type: 'string'
						}
					},
					type: 'object'
				},
				maxzoom: {
					type: 'number'
				},
				metadata: {},
				minzoom: {
					type: 'number'
				},
				paint: {
					additionalProperties: false,
					properties: {
						'line-blur': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'line-color': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ColorSpecification>'
						},
						'line-dasharray': {
							$ref: '#/definitions/PropertyValueSpecification<number[]>'
						},
						'line-gap-width': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'line-gradient': {
							$ref: '#/definitions/ExpressionSpecification'
						},
						'line-offset': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'line-opacity': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'line-pattern': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ResolvedImageSpecification>'
						},
						'line-translate': {
							$ref: '#/definitions/PropertyValueSpecification<[number,number]>'
						},
						'line-translate-anchor': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport")>'
						},
						'line-width': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						}
					},
					type: 'object'
				},
				source: {
					type: 'string'
				},
				'source-layer': {
					type: 'string'
				},
				type: {
					const: 'line',
					type: 'string'
				}
			},
			required: ['id', 'type', 'source'],
			type: 'object'
		},
		LineString: {
			additionalProperties: false,
			description: 'LineString geometry object. https://tools.ietf.org/html/rfc7946#section-3.1.4',
			properties: {
				bbox: {
					$ref: '#/definitions/BBox',
					description:
						"Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections. The value of the bbox member is an array of length 2*n where n is the number of dimensions represented in the contained geometries, with all axes of the most southwesterly point followed by all axes of the more northeasterly point. The axes order of a bbox follows the axes order of geometries. https://tools.ietf.org/html/rfc7946#section-5"
				},
				coordinates: {
					items: {
						$ref: '#/definitions/Position'
					},
					type: 'array'
				},
				type: {
					const: 'LineString',
					description: 'Specifies the type of GeoJSON object.',
					type: 'string'
				}
			},
			required: ['coordinates', 'type'],
			type: 'object'
		},
		MultiLineString: {
			additionalProperties: false,
			description:
				'MultiLineString geometry object. https://tools.ietf.org/html/rfc7946#section-3.1.5',
			properties: {
				bbox: {
					$ref: '#/definitions/BBox',
					description:
						"Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections. The value of the bbox member is an array of length 2*n where n is the number of dimensions represented in the contained geometries, with all axes of the most southwesterly point followed by all axes of the more northeasterly point. The axes order of a bbox follows the axes order of geometries. https://tools.ietf.org/html/rfc7946#section-5"
				},
				coordinates: {
					items: {
						items: {
							$ref: '#/definitions/Position'
						},
						type: 'array'
					},
					type: 'array'
				},
				type: {
					const: 'MultiLineString',
					description: 'Specifies the type of GeoJSON object.',
					type: 'string'
				}
			},
			required: ['coordinates', 'type'],
			type: 'object'
		},
		MultiPoint: {
			additionalProperties: false,
			description: 'MultiPoint geometry object.  https://tools.ietf.org/html/rfc7946#section-3.1.3',
			properties: {
				bbox: {
					$ref: '#/definitions/BBox',
					description:
						"Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections. The value of the bbox member is an array of length 2*n where n is the number of dimensions represented in the contained geometries, with all axes of the most southwesterly point followed by all axes of the more northeasterly point. The axes order of a bbox follows the axes order of geometries. https://tools.ietf.org/html/rfc7946#section-5"
				},
				coordinates: {
					items: {
						$ref: '#/definitions/Position'
					},
					type: 'array'
				},
				type: {
					const: 'MultiPoint',
					description: 'Specifies the type of GeoJSON object.',
					type: 'string'
				}
			},
			required: ['coordinates', 'type'],
			type: 'object'
		},
		MultiPolygon: {
			additionalProperties: false,
			description:
				'MultiPolygon geometry object. https://tools.ietf.org/html/rfc7946#section-3.1.7',
			properties: {
				bbox: {
					$ref: '#/definitions/BBox',
					description:
						"Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections. The value of the bbox member is an array of length 2*n where n is the number of dimensions represented in the contained geometries, with all axes of the most southwesterly point followed by all axes of the more northeasterly point. The axes order of a bbox follows the axes order of geometries. https://tools.ietf.org/html/rfc7946#section-5"
				},
				coordinates: {
					items: {
						items: {
							items: {
								$ref: '#/definitions/Position'
							},
							type: 'array'
						},
						type: 'array'
					},
					type: 'array'
				},
				type: {
					const: 'MultiPolygon',
					description: 'Specifies the type of GeoJSON object.',
					type: 'string'
				}
			},
			required: ['coordinates', 'type'],
			type: 'object'
		},
		PaddingSpecification: {
			anyOf: [
				{
					type: 'number'
				},
				{
					items: {
						type: 'number'
					},
					type: 'array'
				}
			]
		},
		Point: {
			additionalProperties: false,
			description: 'Point geometry object. https://tools.ietf.org/html/rfc7946#section-3.1.2',
			properties: {
				bbox: {
					$ref: '#/definitions/BBox',
					description:
						"Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections. The value of the bbox member is an array of length 2*n where n is the number of dimensions represented in the contained geometries, with all axes of the most southwesterly point followed by all axes of the more northeasterly point. The axes order of a bbox follows the axes order of geometries. https://tools.ietf.org/html/rfc7946#section-5"
				},
				coordinates: {
					$ref: '#/definitions/Position'
				},
				type: {
					const: 'Point',
					description: 'Specifies the type of GeoJSON object.',
					type: 'string'
				}
			},
			required: ['coordinates', 'type'],
			type: 'object'
		},
		Polygon: {
			additionalProperties: false,
			description: 'Polygon geometry object. https://tools.ietf.org/html/rfc7946#section-3.1.6',
			properties: {
				bbox: {
					$ref: '#/definitions/BBox',
					description:
						"Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections. The value of the bbox member is an array of length 2*n where n is the number of dimensions represented in the contained geometries, with all axes of the most southwesterly point followed by all axes of the more northeasterly point. The axes order of a bbox follows the axes order of geometries. https://tools.ietf.org/html/rfc7946#section-5"
				},
				coordinates: {
					items: {
						items: {
							$ref: '#/definitions/Position'
						},
						type: 'array'
					},
					type: 'array'
				},
				type: {
					const: 'Polygon',
					description: 'Specifies the type of GeoJSON object.',
					type: 'string'
				}
			},
			required: ['coordinates', 'type'],
			type: 'object'
		},
		Position: {
			description:
				'A Position is an array of coordinates. https://tools.ietf.org/html/rfc7946#section-3.1.1 Array should contain between two and three elements. The previous GeoJSON specification allowed more elements (e.g., which could be used to represent M values), but the current specification only allows X, Y, and (optionally) Z to be defined.',
			items: {
				type: 'number'
			},
			type: 'array'
		},
		ProjectionSpecification: {
			additionalProperties: false,
			properties: {
				type: {
					enum: ['mercator', 'globe'],
					type: 'string'
				}
			},
			type: 'object'
		},
		PromoteIdSpecification: {
			anyOf: [
				{
					additionalProperties: {
						type: 'string'
					},
					type: 'object'
				},
				{
					type: 'string'
				}
			]
		},
		'PropertyValueSpecification<("auto"|"viewport-y"|"source")>': {
			anyOf: [
				{
					const: 'auto',
					type: 'string'
				},
				{
					const: 'viewport-y',
					type: 'string'
				},
				{
					const: 'source',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("auto"|"viewport-y"|"source")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<("butt"|"round"|"square")>': {
			anyOf: [
				{
					const: 'butt',
					type: 'string'
				},
				{
					const: 'round',
					type: 'string'
				},
				{
					const: 'square',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("butt"|"round"|"square")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")[]>':
			{
				anyOf: [
					{
						items: {
							enum: [
								'center',
								'left',
								'right',
								'top',
								'bottom',
								'top-left',
								'top-right',
								'bottom-left',
								'bottom-right'
							],
							type: 'string'
						},
						type: 'array'
					},
					{
						$ref: '#/definitions/CameraFunctionSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")[]>'
					},
					{
						$ref: '#/definitions/ExpressionSpecification'
					}
				]
			},
		'PropertyValueSpecification<("horizontal"|"vertical")[]>': {
			anyOf: [
				{
					items: {
						enum: ['horizontal', 'vertical'],
						type: 'string'
					},
					type: 'array'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("horizontal"|"vertical")[]>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<("linear"|"nearest")>': {
			anyOf: [
				{
					const: 'linear',
					type: 'string'
				},
				{
					const: 'nearest',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("linear"|"nearest")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<("map"|"viewport")>': {
			anyOf: [
				{
					const: 'map',
					type: 'string'
				},
				{
					const: 'viewport',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("map"|"viewport")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<("map"|"viewport"|"auto")>': {
			anyOf: [
				{
					const: 'map',
					type: 'string'
				},
				{
					const: 'viewport',
					type: 'string'
				},
				{
					const: 'auto',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("map"|"viewport"|"auto")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<("map"|"viewport"|"viewport-glyph"|"auto")>': {
			anyOf: [
				{
					const: 'map',
					type: 'string'
				},
				{
					const: 'viewport',
					type: 'string'
				},
				{
					const: 'viewport-glyph',
					type: 'string'
				},
				{
					const: 'auto',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("map"|"viewport"|"viewport-glyph"|"auto")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<("never"|"always"|"cooperative")>': {
			anyOf: [
				{
					const: 'never',
					type: 'string'
				},
				{
					const: 'always',
					type: 'string'
				},
				{
					const: 'cooperative',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("never"|"always"|"cooperative")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<("none"|"width"|"height"|"both")>': {
			anyOf: [
				{
					const: 'none',
					type: 'string'
				},
				{
					const: 'width',
					type: 'string'
				},
				{
					const: 'height',
					type: 'string'
				},
				{
					const: 'both',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("none"|"width"|"height"|"both")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<("point"|"line"|"line-center")>': {
			anyOf: [
				{
					const: 'point',
					type: 'string'
				},
				{
					const: 'line',
					type: 'string'
				},
				{
					const: 'line-center',
					type: 'string'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<("point"|"line"|"line-center")>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<ColorSpecification>': {
			anyOf: [
				{
					$ref: '#/definitions/ColorSpecification'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<ColorSpecification>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<ResolvedImageSpecification>': {
			anyOf: [
				{
					$ref: '#/definitions/ResolvedImageSpecification'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<ResolvedImageSpecification>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<[number,number,number,number]>': {
			anyOf: [
				{
					items: {
						type: 'number'
					},
					maxItems: 4,
					minItems: 4,
					type: 'array'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<[number,number,number,number]>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<[number,number,number]>': {
			anyOf: [
				{
					items: {
						type: 'number'
					},
					maxItems: 3,
					minItems: 3,
					type: 'array'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<[number,number,number]>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<[number,number]>': {
			anyOf: [
				{
					items: {
						type: 'number'
					},
					maxItems: 2,
					minItems: 2,
					type: 'array'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<[number,number]>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<boolean>': {
			anyOf: [
				{
					type: 'boolean'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<boolean>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<number>': {
			anyOf: [
				{
					type: 'number'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<number>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		'PropertyValueSpecification<number[]>': {
			anyOf: [
				{
					items: {
						type: 'number'
					},
					type: 'array'
				},
				{
					$ref: '#/definitions/CameraFunctionSpecification<number[]>'
				},
				{
					$ref: '#/definitions/ExpressionSpecification'
				}
			]
		},
		RasterDEMSourceSpecification: {
			additionalProperties: false,
			properties: {
				attribution: {
					type: 'string'
				},
				baseShift: {
					type: 'number'
				},
				blueFactor: {
					type: 'number'
				},
				bounds: {
					items: {
						type: 'number'
					},
					maxItems: 4,
					minItems: 4,
					type: 'array'
				},
				encoding: {
					enum: ['terrarium', 'mapbox', 'custom'],
					type: 'string'
				},
				greenFactor: {
					type: 'number'
				},
				maxzoom: {
					type: 'number'
				},
				minzoom: {
					type: 'number'
				},
				redFactor: {
					type: 'number'
				},
				tileSize: {
					type: 'number'
				},
				tiles: {
					items: {
						type: 'string'
					},
					type: 'array'
				},
				type: {
					const: 'raster-dem',
					type: 'string'
				},
				url: {
					type: 'string'
				},
				volatile: {
					type: 'boolean'
				}
			},
			required: ['type'],
			type: 'object'
		},
		RasterLayerSpecification: {
			additionalProperties: false,
			properties: {
				filter: {
					$ref: '#/definitions/FilterSpecification'
				},
				id: {
					type: 'string'
				},
				layout: {
					additionalProperties: false,
					properties: {
						visibility: {
							enum: ['visible', 'none'],
							type: 'string'
						}
					},
					type: 'object'
				},
				maxzoom: {
					type: 'number'
				},
				metadata: {},
				minzoom: {
					type: 'number'
				},
				paint: {
					additionalProperties: false,
					properties: {
						'raster-brightness-max': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'raster-brightness-min': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'raster-contrast': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'raster-fade-duration': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'raster-hue-rotate': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'raster-opacity': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'raster-resampling': {
							$ref: '#/definitions/PropertyValueSpecification<("linear"|"nearest")>'
						},
						'raster-saturation': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						}
					},
					type: 'object'
				},
				source: {
					type: 'string'
				},
				'source-layer': {
					type: 'string'
				},
				type: {
					const: 'raster',
					type: 'string'
				}
			},
			required: ['id', 'type', 'source'],
			type: 'object'
		},
		RasterSourceSpecification: {
			additionalProperties: false,
			properties: {
				attribution: {
					type: 'string'
				},
				bounds: {
					items: {
						type: 'number'
					},
					maxItems: 4,
					minItems: 4,
					type: 'array'
				},
				maxzoom: {
					type: 'number'
				},
				minzoom: {
					type: 'number'
				},
				scheme: {
					enum: ['xyz', 'tms'],
					type: 'string'
				},
				tileSize: {
					type: 'number'
				},
				tiles: {
					items: {
						type: 'string'
					},
					type: 'array'
				},
				type: {
					const: 'raster',
					type: 'string'
				},
				url: {
					type: 'string'
				},
				volatile: {
					type: 'boolean'
				}
			},
			required: ['type'],
			type: 'object'
		},
		ResolvedImageSpecification: {
			type: 'string'
		},
		SkySpecification: {
			additionalProperties: false,
			properties: {
				'atmosphere-blend': {
					$ref: '#/definitions/PropertyValueSpecification<number>'
				},
				'fog-color': {
					$ref: '#/definitions/PropertyValueSpecification<ColorSpecification>'
				},
				'fog-ground-blend': {
					$ref: '#/definitions/PropertyValueSpecification<number>'
				},
				'horizon-color': {
					$ref: '#/definitions/PropertyValueSpecification<ColorSpecification>'
				},
				'horizon-fog-blend': {
					$ref: '#/definitions/PropertyValueSpecification<number>'
				},
				'sky-color': {
					$ref: '#/definitions/PropertyValueSpecification<ColorSpecification>'
				},
				'sky-horizon-blend': {
					$ref: '#/definitions/PropertyValueSpecification<number>'
				}
			},
			type: 'object'
		},
		'SourceFunctionSpecification<("auto"|"left"|"center"|"right")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['auto', 'left', 'center', 'right'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['auto', 'left', 'center', 'right'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['auto', 'left', 'center', 'right'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['auto', 'left', 'center', 'right'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['auto', 'left', 'center', 'right'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: ['string', 'number', 'boolean']
									},
									{
										enum: ['auto', 'left', 'center', 'right'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['auto', 'left', 'center', 'right'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						type: {
							const: 'identity',
							type: 'string'
						}
					},
					required: ['type', 'property'],
					type: 'object'
				}
			]
		},
		'SourceFunctionSpecification<("bevel"|"round"|"miter")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['bevel', 'round', 'miter'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['bevel', 'round', 'miter'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['bevel', 'round', 'miter'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['bevel', 'round', 'miter'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['bevel', 'round', 'miter'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: ['string', 'number', 'boolean']
									},
									{
										enum: ['bevel', 'round', 'miter'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['bevel', 'round', 'miter'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						type: {
							const: 'identity',
							type: 'string'
						}
					},
					required: ['type', 'property'],
					type: 'object'
				}
			]
		},
		'SourceFunctionSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")>':
			{
				anyOf: [
					{
						additionalProperties: false,
						properties: {
							default: {
								enum: [
									'center',
									'left',
									'right',
									'top',
									'bottom',
									'top-left',
									'top-right',
									'bottom-left',
									'bottom-right'
								],
								type: 'string'
							},
							property: {
								type: 'string'
							},
							stops: {
								items: {
									items: [
										{
											type: 'number'
										},
										{
											enum: [
												'center',
												'left',
												'right',
												'top',
												'bottom',
												'top-left',
												'top-right',
												'bottom-left',
												'bottom-right'
											],
											type: 'string'
										}
									],
									maxItems: 2,
									minItems: 2,
									type: 'array'
								},
								type: 'array'
							},
							type: {
								const: 'exponential',
								type: 'string'
							}
						},
						required: ['type', 'stops', 'property'],
						type: 'object'
					},
					{
						additionalProperties: false,
						properties: {
							default: {
								enum: [
									'center',
									'left',
									'right',
									'top',
									'bottom',
									'top-left',
									'top-right',
									'bottom-left',
									'bottom-right'
								],
								type: 'string'
							},
							property: {
								type: 'string'
							},
							stops: {
								items: {
									items: [
										{
											type: 'number'
										},
										{
											enum: [
												'center',
												'left',
												'right',
												'top',
												'bottom',
												'top-left',
												'top-right',
												'bottom-left',
												'bottom-right'
											],
											type: 'string'
										}
									],
									maxItems: 2,
									minItems: 2,
									type: 'array'
								},
								type: 'array'
							},
							type: {
								const: 'interval',
								type: 'string'
							}
						},
						required: ['type', 'stops', 'property'],
						type: 'object'
					},
					{
						additionalProperties: false,
						properties: {
							default: {
								enum: [
									'center',
									'left',
									'right',
									'top',
									'bottom',
									'top-left',
									'top-right',
									'bottom-left',
									'bottom-right'
								],
								type: 'string'
							},
							property: {
								type: 'string'
							},
							stops: {
								items: {
									items: [
										{
											type: ['string', 'number', 'boolean']
										},
										{
											enum: [
												'center',
												'left',
												'right',
												'top',
												'bottom',
												'top-left',
												'top-right',
												'bottom-left',
												'bottom-right'
											],
											type: 'string'
										}
									],
									maxItems: 2,
									minItems: 2,
									type: 'array'
								},
								type: 'array'
							},
							type: {
								const: 'categorical',
								type: 'string'
							}
						},
						required: ['type', 'stops', 'property'],
						type: 'object'
					},
					{
						additionalProperties: false,
						properties: {
							default: {
								enum: [
									'center',
									'left',
									'right',
									'top',
									'bottom',
									'top-left',
									'top-right',
									'bottom-left',
									'bottom-right'
								],
								type: 'string'
							},
							property: {
								type: 'string'
							},
							type: {
								const: 'identity',
								type: 'string'
							}
						},
						required: ['type', 'property'],
						type: 'object'
					}
				]
			},
		'SourceFunctionSpecification<("none"|"uppercase"|"lowercase")>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['none', 'uppercase', 'lowercase'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['none', 'uppercase', 'lowercase'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['none', 'uppercase', 'lowercase'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										enum: ['none', 'uppercase', 'lowercase'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['none', 'uppercase', 'lowercase'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: ['string', 'number', 'boolean']
									},
									{
										enum: ['none', 'uppercase', 'lowercase'],
										type: 'string'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							enum: ['none', 'uppercase', 'lowercase'],
							type: 'string'
						},
						property: {
							type: 'string'
						},
						type: {
							const: 'identity',
							type: 'string'
						}
					},
					required: ['type', 'property'],
					type: 'object'
				}
			]
		},
		'SourceFunctionSpecification<ColorSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ColorSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/ColorSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ColorSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/ColorSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ColorSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: ['string', 'number', 'boolean']
									},
									{
										$ref: '#/definitions/ColorSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ColorSpecification'
						},
						property: {
							type: 'string'
						},
						type: {
							const: 'identity',
							type: 'string'
						}
					},
					required: ['type', 'property'],
					type: 'object'
				}
			]
		},
		'SourceFunctionSpecification<FormattedSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/FormattedSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/FormattedSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/FormattedSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/FormattedSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/FormattedSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: ['string', 'number', 'boolean']
									},
									{
										$ref: '#/definitions/FormattedSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/FormattedSpecification'
						},
						property: {
							type: 'string'
						},
						type: {
							const: 'identity',
							type: 'string'
						}
					},
					required: ['type', 'property'],
					type: 'object'
				}
			]
		},
		'SourceFunctionSpecification<PaddingSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/PaddingSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/PaddingSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/PaddingSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/PaddingSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/PaddingSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: ['string', 'number', 'boolean']
									},
									{
										$ref: '#/definitions/PaddingSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/PaddingSpecification'
						},
						property: {
							type: 'string'
						},
						type: {
							const: 'identity',
							type: 'string'
						}
					},
					required: ['type', 'property'],
					type: 'object'
				}
			]
		},
		'SourceFunctionSpecification<ResolvedImageSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ResolvedImageSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/ResolvedImageSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ResolvedImageSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/ResolvedImageSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ResolvedImageSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: ['string', 'number', 'boolean']
									},
									{
										$ref: '#/definitions/ResolvedImageSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/ResolvedImageSpecification'
						},
						property: {
							type: 'string'
						},
						type: {
							const: 'identity',
							type: 'string'
						}
					},
					required: ['type', 'property'],
					type: 'object'
				}
			]
		},
		'SourceFunctionSpecification<VariableAnchorOffsetCollectionSpecification>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: ['string', 'number', 'boolean']
									},
									{
										$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							$ref: '#/definitions/VariableAnchorOffsetCollectionSpecification'
						},
						property: {
							type: 'string'
						},
						type: {
							const: 'identity',
							type: 'string'
						}
					},
					required: ['type', 'property'],
					type: 'object'
				}
			]
		},
		'SourceFunctionSpecification<[number,number]>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'number'
							},
							maxItems: 2,
							minItems: 2,
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 2,
										minItems: 2,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'number'
							},
							maxItems: 2,
							minItems: 2,
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 2,
										minItems: 2,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'number'
							},
							maxItems: 2,
							minItems: 2,
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: ['string', 'number', 'boolean']
									},
									{
										items: {
											type: 'number'
										},
										maxItems: 2,
										minItems: 2,
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'number'
							},
							maxItems: 2,
							minItems: 2,
							type: 'array'
						},
						property: {
							type: 'string'
						},
						type: {
							const: 'identity',
							type: 'string'
						}
					},
					required: ['type', 'property'],
					type: 'object'
				}
			]
		},
		'SourceFunctionSpecification<number>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							type: 'number'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: {
									type: 'number'
								},
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							type: 'number'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: {
									type: 'number'
								},
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							type: 'number'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: ['string', 'number', 'boolean']
									},
									{
										type: 'number'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							type: 'number'
						},
						property: {
							type: 'string'
						},
						type: {
							const: 'identity',
							type: 'string'
						}
					},
					required: ['type', 'property'],
					type: 'object'
				}
			]
		},
		'SourceFunctionSpecification<string[]>': {
			anyOf: [
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'string'
							},
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'string'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'exponential',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'string'
							},
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: 'number'
									},
									{
										items: {
											type: 'string'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'interval',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'string'
							},
							type: 'array'
						},
						property: {
							type: 'string'
						},
						stops: {
							items: {
								items: [
									{
										type: ['string', 'number', 'boolean']
									},
									{
										items: {
											type: 'string'
										},
										type: 'array'
									}
								],
								maxItems: 2,
								minItems: 2,
								type: 'array'
							},
							type: 'array'
						},
						type: {
							const: 'categorical',
							type: 'string'
						}
					},
					required: ['type', 'stops', 'property'],
					type: 'object'
				},
				{
					additionalProperties: false,
					properties: {
						default: {
							items: {
								type: 'string'
							},
							type: 'array'
						},
						property: {
							type: 'string'
						},
						type: {
							const: 'identity',
							type: 'string'
						}
					},
					required: ['type', 'property'],
					type: 'object'
				}
			]
		},
		SourceSpecification: {
			anyOf: [
				{
					$ref: '#/definitions/VectorSourceSpecification'
				},
				{
					$ref: '#/definitions/RasterSourceSpecification'
				},
				{
					$ref: '#/definitions/RasterDEMSourceSpecification'
				},
				{
					$ref: '#/definitions/GeoJSONSourceSpecification'
				},
				{
					$ref: '#/definitions/VideoSourceSpecification'
				},
				{
					$ref: '#/definitions/ImageSourceSpecification'
				}
			]
		},
		SpriteSpecification: {
			anyOf: [
				{
					type: 'string'
				},
				{
					items: {
						additionalProperties: false,
						properties: {
							id: {
								type: 'string'
							},
							url: {
								type: 'string'
							}
						},
						required: ['id', 'url'],
						type: 'object'
					},
					type: 'array'
				}
			]
		},
		StyleSpecification: {
			additionalProperties: false,
			properties: {
				bearing: {
					type: 'number'
				},
				center: {
					items: {
						type: 'number'
					},
					type: 'array'
				},
				glyphs: {
					type: 'string'
				},
				layers: {
					items: {
						$ref: '#/definitions/LayerSpecification'
					},
					type: 'array'
				},
				light: {
					$ref: '#/definitions/LightSpecification'
				},
				metadata: {},
				name: {
					type: 'string'
				},
				pitch: {
					type: 'number'
				},
				projection: {
					$ref: '#/definitions/ProjectionSpecification'
				},
				sky: {
					$ref: '#/definitions/SkySpecification'
				},
				sources: {
					additionalProperties: {
						$ref: '#/definitions/SourceSpecification'
					},
					type: 'object'
				},
				sprite: {
					$ref: '#/definitions/SpriteSpecification'
				},
				terrain: {
					$ref: '#/definitions/TerrainSpecification'
				},
				transition: {
					$ref: '#/definitions/TransitionSpecification'
				},
				version: {
					const: 8,
					type: 'number'
				},
				zoom: {
					type: 'number'
				}
			},
			required: ['version', 'sources', 'layers'],
			type: 'object'
		},
		SymbolLayerSpecification: {
			additionalProperties: false,
			properties: {
				filter: {
					$ref: '#/definitions/FilterSpecification'
				},
				id: {
					type: 'string'
				},
				layout: {
					additionalProperties: false,
					properties: {
						'icon-allow-overlap': {
							$ref: '#/definitions/PropertyValueSpecification<boolean>'
						},
						'icon-anchor': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")>'
						},
						'icon-ignore-placement': {
							$ref: '#/definitions/PropertyValueSpecification<boolean>'
						},
						'icon-image': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ResolvedImageSpecification>'
						},
						'icon-keep-upright': {
							$ref: '#/definitions/PropertyValueSpecification<boolean>'
						},
						'icon-offset': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<[number,number]>'
						},
						'icon-optional': {
							$ref: '#/definitions/PropertyValueSpecification<boolean>'
						},
						'icon-overlap': {
							$ref: '#/definitions/PropertyValueSpecification<("never"|"always"|"cooperative")>'
						},
						'icon-padding': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<PaddingSpecification>'
						},
						'icon-pitch-alignment': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport"|"auto")>'
						},
						'icon-rotate': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'icon-rotation-alignment': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport"|"auto")>'
						},
						'icon-size': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'icon-text-fit': {
							$ref: '#/definitions/PropertyValueSpecification<("none"|"width"|"height"|"both")>'
						},
						'icon-text-fit-padding': {
							$ref: '#/definitions/PropertyValueSpecification<[number,number,number,number]>'
						},
						'symbol-avoid-edges': {
							$ref: '#/definitions/PropertyValueSpecification<boolean>'
						},
						'symbol-placement': {
							$ref: '#/definitions/PropertyValueSpecification<("point"|"line"|"line-center")>'
						},
						'symbol-sort-key': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'symbol-spacing': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'symbol-z-order': {
							$ref: '#/definitions/PropertyValueSpecification<("auto"|"viewport-y"|"source")>'
						},
						'text-allow-overlap': {
							$ref: '#/definitions/PropertyValueSpecification<boolean>'
						},
						'text-anchor': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")>'
						},
						'text-field': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<FormattedSpecification>'
						},
						'text-font': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<string[]>'
						},
						'text-ignore-placement': {
							$ref: '#/definitions/PropertyValueSpecification<boolean>'
						},
						'text-justify': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<("auto"|"left"|"center"|"right")>'
						},
						'text-keep-upright': {
							$ref: '#/definitions/PropertyValueSpecification<boolean>'
						},
						'text-letter-spacing': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'text-line-height': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'text-max-angle': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'text-max-width': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'text-offset': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<[number,number]>'
						},
						'text-optional': {
							$ref: '#/definitions/PropertyValueSpecification<boolean>'
						},
						'text-overlap': {
							$ref: '#/definitions/PropertyValueSpecification<("never"|"always"|"cooperative")>'
						},
						'text-padding': {
							$ref: '#/definitions/PropertyValueSpecification<number>'
						},
						'text-pitch-alignment': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport"|"auto")>'
						},
						'text-radial-offset': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'text-rotate': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'text-rotation-alignment': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport"|"viewport-glyph"|"auto")>'
						},
						'text-size': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'text-transform': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<("none"|"uppercase"|"lowercase")>'
						},
						'text-variable-anchor': {
							$ref: '#/definitions/PropertyValueSpecification<("center"|"left"|"right"|"top"|"bottom"|"top-left"|"top-right"|"bottom-left"|"bottom-right")[]>'
						},
						'text-variable-anchor-offset': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<VariableAnchorOffsetCollectionSpecification>'
						},
						'text-writing-mode': {
							$ref: '#/definitions/PropertyValueSpecification<("horizontal"|"vertical")[]>'
						},
						visibility: {
							enum: ['visible', 'none'],
							type: 'string'
						}
					},
					type: 'object'
				},
				maxzoom: {
					type: 'number'
				},
				metadata: {},
				minzoom: {
					type: 'number'
				},
				paint: {
					additionalProperties: false,
					properties: {
						'icon-color': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ColorSpecification>'
						},
						'icon-halo-blur': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'icon-halo-color': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ColorSpecification>'
						},
						'icon-halo-width': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'icon-opacity': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'icon-translate': {
							$ref: '#/definitions/PropertyValueSpecification<[number,number]>'
						},
						'icon-translate-anchor': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport")>'
						},
						'text-color': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ColorSpecification>'
						},
						'text-halo-blur': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'text-halo-color': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<ColorSpecification>'
						},
						'text-halo-width': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'text-opacity': {
							$ref: '#/definitions/DataDrivenPropertyValueSpecification<number>'
						},
						'text-translate': {
							$ref: '#/definitions/PropertyValueSpecification<[number,number]>'
						},
						'text-translate-anchor': {
							$ref: '#/definitions/PropertyValueSpecification<("map"|"viewport")>'
						}
					},
					type: 'object'
				},
				source: {
					type: 'string'
				},
				'source-layer': {
					type: 'string'
				},
				type: {
					const: 'symbol',
					type: 'string'
				}
			},
			required: ['id', 'type', 'source'],
			type: 'object'
		},
		TerrainSpecification: {
			additionalProperties: false,
			properties: {
				exaggeration: {
					type: 'number'
				},
				source: {
					type: 'string'
				}
			},
			required: ['source'],
			type: 'object'
		},
		TransitionSpecification: {
			additionalProperties: false,
			properties: {
				delay: {
					type: 'number'
				},
				duration: {
					type: 'number'
				}
			},
			type: 'object'
		},
		VariableAnchorOffsetCollectionSpecification: {
			items: {
				anyOf: [
					{
						type: 'string'
					},
					{
						items: {
							type: 'number'
						},
						maxItems: 2,
						minItems: 2,
						type: 'array'
					}
				]
			},
			type: 'array'
		},
		VectorSourceSpecification: {
			additionalProperties: false,
			properties: {
				attribution: {
					type: 'string'
				},
				bounds: {
					items: {
						type: 'number'
					},
					maxItems: 4,
					minItems: 4,
					type: 'array'
				},
				maxzoom: {
					type: 'number'
				},
				minzoom: {
					type: 'number'
				},
				promoteId: {
					$ref: '#/definitions/PromoteIdSpecification'
				},
				scheme: {
					enum: ['xyz', 'tms'],
					type: 'string'
				},
				tiles: {
					items: {
						type: 'string'
					},
					type: 'array'
				},
				type: {
					const: 'vector',
					type: 'string'
				},
				url: {
					type: 'string'
				},
				volatile: {
					type: 'boolean'
				}
			},
			required: ['type'],
			type: 'object'
		},
		VideoSourceSpecification: {
			additionalProperties: false,
			properties: {
				coordinates: {
					items: {
						items: {
							type: 'number'
						},
						maxItems: 2,
						minItems: 2,
						type: 'array'
					},
					maxItems: 4,
					minItems: 4,
					type: 'array'
				},
				type: {
					const: 'video',
					type: 'string'
				},
				urls: {
					items: {
						type: 'string'
					},
					type: 'array'
				}
			},
			required: ['type', 'urls', 'coordinates'],
			type: 'object'
		}
	}
};
