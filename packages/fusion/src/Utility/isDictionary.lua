--!strict
--[[
    Returns true if a is an array or undetermined value
]]

local getTableType = require(script.Parent.getTableType)

local function isDictionary(a: any): boolean
	local tableType = getTableType(a)
	return tableType == "Dictionary" or tableType == "Undetermined" 
end

return isDictionary