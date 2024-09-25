--!strict
--[[
    Returns true if a is an array or undetermined table type
]]

local getTableType = require(script.Parent.getTableType)

local function isArray(a: any): boolean
	local tableType = getTableType(a)
	return tableType == "Array" or tableType == "Undetermined" 
end

return isArray